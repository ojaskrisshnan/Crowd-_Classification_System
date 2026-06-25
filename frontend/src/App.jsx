import { useState } from "react";
import Dashboard from "./pages/Dashboard.jsx";
import Evaluation from "./pages/Evaluation.jsx";

export default function App() {
  const [view, setView] = useState("dashboard");

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <div className="border-b border-slate-800 bg-slate-900/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <div className="text-sm font-semibold">
            Bus Video-Based Crowd Classification &amp; Smart Recommendation
          </div>
          <div className="flex gap-2 text-xs">
            <button
              onClick={() => setView("dashboard")}
              className={`rounded-lg px-3 py-1 ${
                view === "dashboard"
                  ? "bg-emerald-500 text-slate-950"
                  : "bg-slate-800 text-slate-200"
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setView("evaluation")}
              className={`rounded-lg px-3 py-1 ${
                view === "evaluation"
                  ? "bg-emerald-500 text-slate-950"
                  : "bg-slate-800 text-slate-200"
              }`}
            >
              Evaluation
            </button>
          </div>
        </div>
      </div>
      {view === "dashboard" ? <Dashboard /> : <Evaluation />}
    </div>
  );
}

