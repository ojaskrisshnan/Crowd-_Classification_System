import { API_BASE } from "../lib/api.js";

export default function BusAnalysisPanel({ bus, onClose }) {
  if (!bus) return null;

  const metrics = bus.video_metrics || {};
  const hasSamples =
    Array.isArray(metrics.raw_sample_frames) && metrics.raw_sample_frames.length > 0;

  return (
    <div className="mt-8 rounded-2xl bg-slate-900 p-5 ring-1 ring-slate-800">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-lg font-semibold">
            Video Crowd Analysis – Bus {bus.bus_id}
          </div>
          <div className="text-xs text-slate-400">
            Detailed pipeline view: frame extraction → person detection → classification.
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-800 px-3 py-1 text-xs font-semibold hover:bg-slate-700"
          >
            Close
          </button>
        )}
      </div>

      {!hasSamples ? (
        <div className="mt-4 text-sm text-slate-400">
          No analysis available yet. Upload a video for this bus to see frame extraction, detection
          and classification results.
        </div>
      ) : (
        <>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl bg-slate-800 p-3">
              <div className="text-xs text-slate-400">Stage 1: Frame Extraction</div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {metrics.raw_sample_frames.map((name) => (
                  <img
                    key={name}
                    src={`${API_BASE}/result/${name}`}
                    alt="Raw frame"
                    className="h-24 w-full rounded-lg object-cover"
                  />
                ))}
              </div>
            </div>

            <div className="rounded-xl bg-slate-800 p-3">
              <div className="text-xs text-slate-400">Stage 2: Person Detection</div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {(metrics.detection_sample_frames || []).map((name) => (
                  <img
                    key={name}
                    src={`${API_BASE}/result/${name}`}
                    alt="Detection frame"
                    className="h-24 w-full rounded-lg object-cover"
                  />
                ))}
              </div>
            </div>

            <div className="rounded-xl bg-slate-800 p-3">
              <div className="text-xs text-slate-400">Stage 3: Crowd Classification</div>
              <div className="mt-2 space-y-1 text-sm">
                <div>
                  <span className="text-slate-400">Max people:</span>{" "}
                  <span className="font-semibold">{metrics.max_count ?? "—"}</span>
                </div>
                <div>
                  <span className="text-slate-400">Average people:</span>{" "}
                  <span className="font-semibold">{metrics.avg_count ?? "—"}</span>
                </div>
                <div>
                  <span className="text-slate-400">Crowd status:</span>{" "}
                  <span className="font-semibold">{bus.crowd_status ?? "—"}</span>
                </div>
                <div>
                  <span className="text-slate-400">Total frames:</span>{" "}
                  <span className="font-semibold">{metrics.total_frames ?? "—"}</span>
                </div>
                <div>
                  <span className="text-slate-400">Avg time / frame:</span>{" "}
                  <span className="font-semibold">
                    {metrics.avg_frame_time != null ? `${metrics.avg_frame_time}s` : "—"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {Array.isArray(metrics.sample_counts) && metrics.sample_counts.length > 0 && (
            <div className="mt-4 rounded-xl bg-slate-800 p-3 text-xs text-slate-300">
              <div className="text-slate-400">
                Sampled frame counts (used for evaluation):
              </div>
              <div className="mt-1">
                {metrics.sample_counts.map((c, idx) => (
                  <span key={idx} className="mr-2">
                    F{metrics.sample_frame_numbers?.[idx] ?? idx}: {c}
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

