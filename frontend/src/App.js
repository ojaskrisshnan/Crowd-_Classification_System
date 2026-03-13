import React, { useState } from 'react';
import './App.css';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

const API_URL = 'http://localhost:5000/api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

function App() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [actualCountsText, setActualCountsText] = useState('');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
      setError(null);
    }
  };

  const parseActualCounts = () => {
    const values = actualCountsText
      .split(/[\s,]+/)
      .map((v) => v.trim())
      .filter(Boolean)
      .map((v) => Number(v));

    if (values.some((v) => Number.isNaN(v) || v < 0)) return null;
    return values;
  };

  const computeCountMetrics = () => {
    if (!result || result.file_type !== 'video') return null;
    const predicted = Array.isArray(result.sample_counts) ? result.sample_counts : [];
    const actual = parseActualCounts();
    if (!actual || predicted.length === 0) return null;

    const n = Math.min(predicted.length, actual.length);
    if (n === 0) return null;

    let absErrSum = 0;
    let actualSum = 0;
    let exactMatches = 0;

    for (let i = 0; i < n; i++) {
      const p = Number(predicted[i]);
      const a = Number(actual[i]);
      absErrSum += Math.abs(p - a);
      actualSum += a;
      if (p === a) exactMatches += 1;
    }

    const mae = absErrSum / n;
    const mape = actualSum > 0 ? (absErrSum / actualSum) * 100 : null;
    const countingAccuracy =
      actualSum > 0 ? Math.max(0, 1 - absErrSum / actualSum) * 100 : null;
    const exactMatchAccuracy = (exactMatches / n) * 100;

    return {
      n,
      mae: Number(mae.toFixed(3)),
      mape: mape === null ? null : Number(mape.toFixed(2)),
      countingAccuracy: countingAccuracy === null ? null : Number(countingAccuracy.toFixed(2)),
      exactMatchAccuracy: Number(exactMatchAccuracy.toFixed(2)),
      predicted: predicted.slice(0, n),
      actual: actual.slice(0, n),
    };
  };

  const metrics = computeCountMetrics();

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(`${API_URL}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setResult(response.data);
      setActualCountsText('');
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred during upload');
      console.error('Upload error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getCrowdLevelColor = (level) => {
    switch (level) {
      case 'Empty':
        return '#4CAF50';
      case 'Moderate':
        return '#FFC107';
      case 'Crowded':
        return '#FF9800';
      case 'Jam-packed':
        return '#F44336';
      default:
        return '#666';
    }
  };

  return (
    <div className="App">
      <div className="container">
        <header className="header">
          <h1>Bus Crowd Classification</h1>
          <p>Upload an image or video to visualize each processing stage</p>
        </header>

        <div className="upload-section">
          <div className="upload-box">
            <input
              type="file"
              id="file-input"
              accept="image/*,video/*"
              onChange={handleFileChange}
              className="file-input"
            />
            <label htmlFor="file-input" className="file-label">
              {file ? file.name : 'Choose Image or Video'}
            </label>
            <button
              onClick={handleUpload}
              disabled={!file || loading}
              className="upload-button"
            >
              {loading ? 'Processing...' : 'Upload & Analyze'}
            </button>
          </div>
        </div>

        {error && (
          <div className="error-message">
            <p>❌ {error}</p>
          </div>
        )}

        {result && (
          <div className="results-section">
            <h2>Detection Results</h2>
            
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-label">People Count</div>
                <div className="stat-value">
                  {result.file_type === 'video' ? result.max_count : result.count}
                </div>
                {result.file_type === 'video' && (
                  <div className="stat-subtext">Max: {result.max_count} | Avg: {result.avg_count}</div>
                )}
              </div>

              <div className="stat-card">
                <div className="stat-label">Crowd Level</div>
                <div
                  className="stat-value"
                  style={{ color: getCrowdLevelColor(result.crowd_level) }}
                >
                  {result.crowd_level}
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-label">Processing Time</div>
                <div className="stat-value">
                  {result.file_type === 'video' 
                    ? `${result.total_processing_time}s` 
                    : `${result.processing_time}s`}
                </div>
                {result.file_type === 'video' && (
                  <div className="stat-subtext">Avg per frame: {result.avg_frame_time}s</div>
                )}
              </div>
            </div>

            <div className="pipeline-section">
              <h3>Processing Pipeline</h3>
              <div className="pipeline-steps">
                <div className="pipeline-card">
                  <div className="pipeline-title">Stage 1: Frame Extraction</div>
                  {result.file_type === 'video' ? (
                    Array.isArray(result.raw_sample_frames) && result.raw_sample_frames.length > 0 ? (
                      <div className="pipeline-gallery">
                        {result.raw_sample_frames.map((frameName, idx) => (
                          <img
                            key={idx}
                            src={`${API_URL}/result/${frameName}`}
                            alt={`Raw frame ${idx + 1}`}
                            className="pipeline-image small"
                          />
                        ))}
                      </div>
                    ) : (
                      <p className="pipeline-text">
                        Raw frames are extracted from the input video for analysis.
                      </p>
                    )
                  ) : (
                    <img
                      src={`${API_URL}/result/${result.original_image || result.result_image}`}
                      alt="Original frame"
                      className="pipeline-image"
                    />
                  )}
                </div>

                <div className="pipeline-card">
                  <div className="pipeline-title">Stage 2: Person Detection</div>
                  {result.file_type === 'video' ? (
                    Array.isArray(result.detection_sample_frames) && result.detection_sample_frames.length > 0 ? (
                      <div className="pipeline-gallery">
                        {result.detection_sample_frames.map((frameName, idx) => (
                          <img
                            key={idx}
                            src={`${API_URL}/result/${frameName}`}
                            alt={`Detection frame ${idx + 1}`}
                            className="pipeline-image small"
                          />
                        ))}
                      </div>
                    ) : (
                      <p className="pipeline-text">
                        YOLO detects persons in each frame and draws bounding boxes.
                      </p>
                    )
                  ) : (
                    <img
                      src={`${API_URL}/result/${result.result_image}`}
                      alt="Detection result"
                      className="pipeline-image"
                    />
                  )}
                </div>

                <div className="pipeline-card">
                  <div className="pipeline-title">Stage 3: Person Counting</div>
                  <div className="pipeline-count">
                    <div>People Count:</div>
                    <div className="pipeline-count-value">
                      {result.file_type === 'video' ? result.max_count : result.count}
                    </div>
                  </div>
                  {result.file_type === 'video' ? (
                    <video
                      src={`${API_URL}/result/${result.result_video}`}
                      controls
                      className="result-video"
                    >
                      Your browser does not support the video tag.
                    </video>
                  ) : (
                    <img
                      src={`${API_URL}/result/${result.result_image}`}
                      alt="Final annotated image"
                      className="pipeline-image"
                    />
                  )}
                </div>
              </div>
            </div>

            {result.file_type === 'video' && (
              <div className="evaluation-section">
                <h3>Evaluation Metrics (Stage 4)</h3>

                <div className="evaluation-card">
                  <div className="evaluation-title">Enter ground-truth counts (optional)</div>
                  <div className="evaluation-subtext">
                    Paste comma/space-separated actual people counts for each sampled frame shown above (up to {Array.isArray(result.sample_counts) ? result.sample_counts.length : 0} values).
                  </div>
                  <textarea
                    className="evaluation-input"
                    value={actualCountsText}
                    onChange={(e) => setActualCountsText(e.target.value)}
                    placeholder="Example: 12, 14, 13, 15, 16, 14"
                  />
                </div>

                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-label">Avg Time / Frame (measured)</div>
                    <div className="stat-value">{result.avg_frame_time}s</div>
                    <div className="stat-subtext">Computed from backend processing</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">Counting Accuracy</div>
                    <div className="stat-value">
                      {metrics?.countingAccuracy != null ? `${metrics.countingAccuracy}%` : '—'}
                    </div>
                    <div className="stat-subtext">Needs ground truth (counts)</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">MAE (Count Error)</div>
                    <div className="stat-value">{metrics ? metrics.mae : '—'}</div>
                    <div className="stat-subtext">Avg |pred − actual| (samples)</div>
                  </div>
                </div>

                <div className="charts-grid">
                  <div className="chart-card">
                    <div className="pipeline-title">Predicted Count (samples)</div>
                    <Line
                      data={{
                        labels: (result.sample_frame_numbers || []).map((x, i) => `F${x ?? i}`),
                        datasets: [
                          {
                            label: 'Predicted',
                            data: result.sample_counts || [],
                            borderColor: '#f5f5f5',
                            backgroundColor: 'rgba(245,245,245,0.08)',
                            tension: 0.25,
                          },
                          ...(metrics
                            ? [
                                {
                                  label: 'Actual',
                                  data: metrics.actual,
                                  borderColor: '#4CAF50',
                                  backgroundColor: 'rgba(76,175,80,0.12)',
                                  tension: 0.25,
                                },
                              ]
                            : []),
                        ],
                      }}
                      options={{
                        responsive: true,
                        plugins: {
                          legend: { labels: { color: '#ddd' } },
                          title: { display: false },
                        },
                        scales: {
                          x: { ticks: { color: '#aaa' }, grid: { color: 'rgba(255,255,255,0.06)' } },
                          y: { ticks: { color: '#aaa' }, grid: { color: 'rgba(255,255,255,0.06)' } },
                        },
                      }}
                    />
                  </div>

                  <div className="chart-card">
                    <div className="pipeline-title">Processing Time per Sampled Frame</div>
                    <Bar
                      data={{
                        labels: (result.sample_frame_numbers || []).map((x, i) => `F${x ?? i}`),
                        datasets: [
                          {
                            label: 'Seconds',
                            data: result.sample_frame_times || [],
                            backgroundColor: 'rgba(245,245,245,0.2)',
                            borderColor: 'rgba(245,245,245,0.6)',
                            borderWidth: 1,
                          },
                        ],
                      }}
                      options={{
                        responsive: true,
                        plugins: {
                          legend: { labels: { color: '#ddd' } },
                          title: { display: false },
                        },
                        scales: {
                          x: { ticks: { color: '#aaa' }, grid: { color: 'rgba(255,255,255,0.06)' } },
                          y: { ticks: { color: '#aaa' }, grid: { color: 'rgba(255,255,255,0.06)' } },
                        },
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;

