import React, { useState } from 'react';
import './App.css';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

function App() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
      setError(null);
    }
  };

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
          <h1>🚌 Bus Crowd Estimation</h1>
          <p>Upload an image or video to detect and count passengers</p>
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

            <div className="result-media">
              <h3>Annotated {result.file_type === 'video' ? 'Video' : 'Image'}</h3>
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
                  alt="Detection result"
                  className="result-image"
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;

