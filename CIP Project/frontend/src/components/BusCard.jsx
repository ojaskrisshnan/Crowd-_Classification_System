import { useRef, useState } from "react";

export default function BusCard({ bus, onUpload, onViewAnalysis }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const pick = () => inputRef.current?.click();

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      await onUpload(bus.bus_id, file);
    } catch (err) {
      setError(err?.response?.data?.error || "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const crowdColor =
    bus.crowd_status === "Low"
      ? "text-emerald-400"
      : bus.crowd_status === "Medium"
        ? "text-amber-400"
        : "text-red-400";

  return (
    <div className="rounded-2xl bg-slate-900 p-4 ring-1 ring-slate-800">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-lg font-semibold">{bus.bus_id}</div>
          <div className="text-xs text-slate-400">{bus.route}</div>
        </div>
        <div className={`text-sm font-semibold ${crowdColor}`}>{bus.crowd_status}</div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-lg bg-slate-800 px-3 py-2">
          <div className="text-xs text-slate-400">Arrival (min)</div>
          <div className="font-semibold">{bus.arrival_time ?? "—"}</div>
        </div>
        <div className="rounded-lg bg-slate-800 px-3 py-2">
          <div className="text-xs text-slate-400">Capacity</div>
          <div className="font-semibold">{bus.capacity ?? "—"}</div>
        </div>
        <div className="rounded-lg bg-slate-800 px-3 py-2">
          <div className="text-xs text-slate-400">People detected</div>
          <div className="font-semibold">{bus.people_detected ?? "—"}</div>
        </div>
        <div className="rounded-lg bg-slate-800 px-3 py-2">
          <div className="text-xs text-slate-400">Confidence</div>
          <div className="font-semibold">{bus.confidence_score ?? "—"}</div>
        </div>
      </div>

      {bus.video_metrics?.raw_sample_frames?.length ? (
        <div className="mt-3 text-xs text-slate-400">
          Samples: {bus.video_metrics.raw_sample_frames.length} frames analyzed
        </div>
      ) : null}

      {error && <div className="mt-2 text-xs text-red-400">{error}</div>}

      <div className="mt-4 flex items-center justify-between gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="video/*"
          onChange={onFile}
          className="hidden"
        />
        <button
          onClick={pick}
          disabled={uploading}
          className="w-full rounded-lg bg-slate-50 py-2 text-sm font-semibold text-slate-950 hover:bg-white disabled:opacity-60"
        >
          {uploading ? "Uploading..." : "Upload Video"}
        </button>
        <button
          type="button"
          onClick={() => onViewAnalysis?.(bus)}
          className="w-full rounded-lg bg-slate-800 py-2 text-xs font-semibold text-slate-50 hover:bg-slate-700"
        >
          View Analysis
        </button>
      </div>
    </div>
  );
}

