import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api.js";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Line } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Tooltip, Legend);

export default function Evaluation() {
  const [buses, setBuses] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/buses");
        setBuses(res.data?.buses || []);
      } catch (e) {
        setError(e?.response?.data?.error || "Failed to load buses for evaluation.");
      }
    })();
  }, []);

  const labelCounts = useMemo(() => {
    const base = { Empty: 0, Moderate: 0, Crowded: 0, "Jam-packed": 0 };
    for (const b of buses) {
      const k = b.crowd_status || "Empty";
      if (base[k] != null) base[k] += 1;
    }
    return base;
  }, [buses]);

  const perBusCounts = useMemo(
    () => buses.map((b) => ({ id: b.bus_id, people: b.people_detected || 0 })),
    [buses]
  );

  const avgProcessing = useMemo(() => {
    const vals = buses
      .map((b) => b.video_metrics?.avg_frame_time)
      .filter((v) => typeof v === "number");
    if (!vals.length) return null;
    const sum = vals.reduce((a, b) => a + b, 0);
    return (sum / vals.length).toFixed(3);
  }, [buses]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 px-6 py-6">
      <div className="mx-auto w-full max-w-5xl">
        <header>
          <h1 className="text-2xl font-semibold">Evaluation Metrics & Model Behaviour</h1>
          <p className="mt-1 text-sm text-slate-400">
            High-level view of how the YOLOv8-based crowd classifier behaves across all buses: label
            distribution, per-bus people counts, and processing speed.
          </p>
        </header>

        {error && (
          <div className="mt-4 rounded-xl bg-red-950/40 p-3 text-sm text-red-300 ring-1 ring-red-900">
            {error}
          </div>
        )}

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl bg-slate-900 p-4 ring-1 ring-slate-800">
            <div className="text-xs text-slate-400">Total buses evaluated</div>
            <div className="text-2xl font-semibold">{buses.length}</div>
          </div>
          <div className="rounded-xl bg-slate-900 p-4 ring-1 ring-slate-800">
            <div className="text-xs text-slate-400">Average people detected / bus</div>
            <div className="text-2xl font-semibold">
              {buses.length
                ? (
                    buses.reduce((sum, b) => sum + (b.people_detected || 0), 0) / buses.length
                  ).toFixed(1)
                : "—"}
            </div>
          </div>
          <div className="rounded-xl bg-slate-900 p-4 ring-1 ring-slate-800">
            <div className="text-xs text-slate-400">Average processing time / frame</div>
            <div className="text-2xl font-semibold">{avgProcessing ?? "—"}s</div>
          </div>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="rounded-xl bg-slate-900 p-4 ring-1 ring-slate-800">
            <div className="text-sm font-semibold">Crowd density label distribution</div>
            <div className="mt-1 text-xs text-slate-400">
              Number of buses assigned to each density class (Empty / Moderate / Crowded / Jam-packed).
            </div>
            <Bar
              data={{
                labels: ["Empty", "Moderate", "Crowded", "Jam-packed"],
                datasets: [
                  {
                    label: "Bus count",
                    data: [
                      labelCounts.Empty,
                      labelCounts.Moderate,
                      labelCounts.Crowded,
                      labelCounts["Jam-packed"],
                    ],
                    backgroundColor: [
                      "rgba(16, 185, 129, 0.6)",
                      "rgba(245, 158, 11, 0.6)",
                      "rgba(249, 115, 22, 0.6)",
                      "rgba(239, 68, 68, 0.6)",
                    ],
                  },
                ],
              }}
              options={{
                responsive: true,
                plugins: {
                  legend: { labels: { color: "#e5e7eb" } },
                },
                scales: {
                  x: { ticks: { color: "#9ca3af" }, grid: { color: "rgba(55,65,81,0.5)" } },
                  y: { ticks: { color: "#9ca3af" }, grid: { color: "rgba(55,65,81,0.5)" } },
                },
              }}
            />
          </div>

          <div className="rounded-xl bg-slate-900 p-4 ring-1 ring-slate-800">
            <div className="text-sm font-semibold">People detected per bus</div>
            <div className="mt-1 text-xs text-slate-400">
              Maximum detected headcount per bus based on current uploaded videos.
            </div>
            <Line
              data={{
                labels: perBusCounts.map((b) => b.id),
                datasets: [
                  {
                    label: "People detected",
                    data: perBusCounts.map((b) => b.people),
                    borderColor: "rgba(56, 189, 248, 0.9)",
                    backgroundColor: "rgba(56, 189, 248, 0.2)",
                    tension: 0.25,
                  },
                ],
              }}
              options={{
                responsive: true,
                plugins: {
                  legend: { labels: { color: "#e5e7eb" } },
                },
                scales: {
                  x: { ticks: { color: "#9ca3af" }, grid: { color: "rgba(55,65,81,0.5)" } },
                  y: { ticks: { color: "#9ca3af" }, grid: { color: "rgba(55,65,81,0.5)" } },
                },
              }}
            />
          </div>
        </div>

        <div className="mt-8 rounded-xl bg-slate-900 p-4 ring-1 ring-slate-800 text-xs text-slate-300">
          <div className="text-sm font-semibold">Evaluation metrics (conceptual)</div>
          <ul className="mt-2 list-disc space-y-1 pl-4">
            <li>
              <span className="font-semibold">Person detection accuracy:</span> Correct detections /
              total ground-truth persons (measured offline using annotated frames).
            </li>
            <li>
              <span className="font-semibold">People counting accuracy:</span>{" "}
              1 − |actual − predicted| / actual, averaged over frames.
            </li>
            <li>
              <span className="font-semibold">Crowd density classification accuracy:</span> correctly
              classified frames / total evaluated frames.
            </li>
            <li>
              <span className="font-semibold">Processing time per frame:</span> average of
              backend-measured frame times (displayed above).
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

