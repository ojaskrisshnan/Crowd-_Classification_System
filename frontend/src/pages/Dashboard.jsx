import { useEffect, useMemo, useState } from "react";
import BusCard from "../components/BusCard.jsx";
import RecommendationPanel from "../components/RecommendationPanel.jsx";
import BusAnalysisPanel from "../components/BusAnalysisPanel.jsx";
import { api } from "../lib/api.js";

export default function Dashboard() {
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rec, setRec] = useState(null);
  const [error, setError] = useState("");
  const [selectedBus, setSelectedBus] = useState(null);

  const loadBuses = async () => {
    const res = await api.get("/buses");
    setBuses(res.data?.buses || []);
  };

  const seed = async () => {
    setLoading(true);
    setError("");
    try {
      await api.post("/buses/seed");
      await loadBuses();
    } catch (e) {
      setError(e?.response?.data?.error || "Failed to seed buses (check MongoDB).");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        await loadBuses();
      } catch {
        // ignore; user can seed
      }
    })();
  }, []);

  const onUpload = async (busId, file) => {
    setError("");
    const fd = new FormData();
    fd.append("file", file);
    await api.post(`/buses/${busId}/upload`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    await loadBuses();
  };

  const recommend = async () => {
    setLoading(true);
    setError("");
    try {
      // demo user location (can be replaced with navigator.geolocation)
      const body = { user_lat: 12.9716, user_lng: 77.5946 };
      const res = await api.post("/recommendation", body);
      setRec(res.data);
      setBuses(res.data?.all_buses || buses);
    } catch (e) {
      setError(e?.response?.data?.error || "Recommendation failed.");
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    const empty = buses.filter((b) => b.crowd_status === "Empty").length;
    const moderate = buses.filter((b) => b.crowd_status === "Moderate").length;
    const crowded = buses.filter((b) => b.crowd_status === "Crowded").length;
    const jamPacked = buses.filter((b) => b.crowd_status === "Jam-packed").length;
    return { empty, moderate, crowded, jamPacked };
  }, [buses]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 px-6 py-6">
      <div className="mx-auto w-full max-w-6xl">
        <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">
              Bus Video-Based Crowd Classification and Smart Bus Recommendation
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Upload bus videos → YOLO detects people → classify as Empty / Moderate / Crowded / Jam-packed →
              combine with ETA and capacity to rank buses.
            </p>
          </div>
        </header>

        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="rounded-xl bg-slate-900 p-4 ring-1 ring-slate-800">
            <div className="text-xs text-slate-400">Empty</div>
            <div className="text-xl font-semibold text-emerald-400">{stats.empty}</div>
          </div>
          <div className="rounded-xl bg-slate-900 p-4 ring-1 ring-slate-800">
            <div className="text-xs text-slate-400">Moderate</div>
            <div className="text-xl font-semibold text-amber-400">{stats.moderate}</div>
          </div>
          <div className="rounded-xl bg-slate-900 p-4 ring-1 ring-slate-800">
            <div className="text-xs text-slate-400">Crowded</div>
            <div className="text-xl font-semibold text-orange-400">{stats.crowded}</div>
          </div>
          <div className="rounded-xl bg-slate-900 p-4 ring-1 ring-slate-800">
            <div className="text-xs text-slate-400">Jam-packed</div>
            <div className="text-xl font-semibold text-red-400">{stats.jamPacked}</div>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-xl bg-red-950/40 p-3 text-sm text-red-300 ring-1 ring-red-900">
            {error}
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={seed}
            disabled={loading}
            className="rounded-lg bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-white disabled:opacity-60"
          >
            Seed 6 Buses (MongoDB)
          </button>
          <button
            onClick={recommend}
            disabled={loading}
            className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-60"
          >
            Recommend Best Bus
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {buses.map((b) => (
            <BusCard
              key={b.bus_id}
              bus={b}
              onUpload={onUpload}
              onViewAnalysis={setSelectedBus}
            />
          ))}
        </div>

        <RecommendationPanel rec={rec} />

        <BusAnalysisPanel bus={selectedBus} onClose={() => setSelectedBus(null)} />
      </div>
    </div>
  );
}

