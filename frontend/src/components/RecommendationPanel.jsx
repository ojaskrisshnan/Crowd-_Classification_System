import MapPanel from "./MapPanel.jsx";

export default function RecommendationPanel({ rec }) {
  if (!rec) {
    return (
      <div className="mt-6 rounded-2xl bg-slate-900 p-5 ring-1 ring-slate-800">
        <div className="text-lg font-semibold">Recommendation</div>
        <div className="mt-1 text-sm text-slate-400">
          Upload videos for 6 buses, then click “Recommend Best Bus”.
        </div>
      </div>
    );
  }

  const { recommended_bus: bus, reason, ranked } = rec;

  return (
    <div className="mt-6 rounded-2xl bg-slate-900 p-5 ring-1 ring-slate-800">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-lg font-semibold">Recommended Bus: {bus.bus_id}</div>
          <div className="text-sm text-slate-400">{bus.route}</div>
        </div>
        <div className="text-sm text-slate-300">
          ETA: <span className="font-semibold">{bus.eta_text || `${bus.arrival_time} mins`}</span>
        </div>
      </div>

      <div className="mt-3 grid gap-2 text-sm text-slate-200">
        {(reason || []).map((r, idx) => (
          <div key={idx} className="rounded-lg bg-slate-800 px-3 py-2">
            {r}
          </div>
        ))}
      </div>

      {bus.directions_url ? (
        <a
          href={bus.directions_url}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-block text-sm font-semibold text-emerald-400 hover:text-emerald-300"
        >
          Open route in OpenStreetMap
        </a>
      ) : null}

      <MapPanel bus={bus} />

      <div className="mt-6 border-t border-slate-800 pt-4">
        <div className="text-sm font-semibold">Working analysis (detection → classification → decision)</div>
        <p className="mt-1 text-xs text-slate-400">
          Each bus video is processed with YOLO to detect people. The maximum people count is classified into
          Empty / Moderate / Crowded / Jam-packed, then combined with ETA and capacity utilization to compute
          the final ranking score.
        </p>

        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="px-2 py-1 text-left">Bus</th>
                <th className="px-2 py-1 text-left">People</th>
                <th className="px-2 py-1 text-left">Crowd status</th>
                <th className="px-2 py-1 text-left">ETA (min)</th>
                <th className="px-2 py-1 text-left">Capacity</th>
                <th className="px-2 py-1 text-left">Score↓</th>
              </tr>
            </thead>
            <tbody>
              {(ranked || []).map(({ score, bus: b }) => (
                <tr key={b.bus_id} className="border-b border-slate-900">
                  <td className="px-2 py-1 font-semibold">{b.bus_id}</td>
                  <td className="px-2 py-1">{b.people_detected ?? "—"}</td>
                  <td className="px-2 py-1">{b.crowd_status ?? "—"}</td>
                  <td className="px-2 py-1">{b.arrival_time ?? "—"}</td>
                  <td className="px-2 py-1">{b.capacity ?? "—"}</td>
                  <td className="px-2 py-1">{score.toFixed(3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

