import { useState } from "react";

export default function Login({ onSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = (e) => {
    e.preventDefault();
    // Demo auth (replace with backend auth later)
    if (username === "admin" && password === "admin123") {
      onSuccess();
      return;
    }
    setError("Invalid credentials (try admin / admin123)");
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <form onSubmit={submit} className="w-full max-w-md rounded-2xl bg-slate-900 p-8 shadow-xl">
        <h1 className="text-2xl font-semibold text-center">
          Bus Video-Based Crowd Classification
        </h1>
        <p className="mt-2 text-center text-sm text-slate-400">
          Admin login to upload bus videos and get recommendations.
        </p>

        <div className="mt-6 space-y-3">
          <div>
            <label className="text-sm text-slate-300">Username</label>
            <input
              className="mt-1 w-full rounded-lg bg-slate-800 px-3 py-2 outline-none ring-1 ring-slate-700 focus:ring-2 focus:ring-emerald-500"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
            />
          </div>

          <div>
            <label className="text-sm text-slate-300">Password</label>
            <input
              type="password"
              className="mt-1 w-full rounded-lg bg-slate-800 px-3 py-2 outline-none ring-1 ring-slate-700 focus:ring-2 focus:ring-emerald-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="admin123"
            />
          </div>

          {error && <div className="text-sm text-red-400">{error}</div>}

          <button
            className="mt-2 w-full rounded-lg bg-emerald-500 py-2 font-semibold text-slate-950 hover:bg-emerald-400"
            type="submit"
          >
            Login
          </button>
        </div>
      </form>
    </div>
  );
}

