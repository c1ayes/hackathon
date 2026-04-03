import React from 'react'
import './App.css'

import { useState } from "react";
import Sidebar from "./components/Sidebar";
import TopBar from "./components/TopBar";
import HeatMap from "./components/HeatMap";
import RoadsPanel from "./components/RoadsPanel";
import CamerasPanel from "./components/CamerasPanel";
import InsightCard from "./components/InsightCard";
import { roadsData, camerasData } from "./data/mockData";

export default function App() {
  const [insight, setInsight] = useState(null);
  const [loading, setLoading] = useState(false);


  async function handleAnalyze() {
    setLoading(true);
    setInsight(null);

    try {
      const response = await fetch("http://localhost:3001/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roads: roadsData, cameras: camerasData }),
      });

      if (!response.ok) throw new Error("Server error");

      const data = await response.json();
      setInsight(data);
    } catch (err) {
      console.warn("Backend unavailable, using mock insight:", err.message);
      setInsight({
        what:
          "5 аварийных дорог. Горячая зона жалоб — центр и мкр. Тастак. Слепая зона камер на Суюнбая.",
        critical:
          "ул. Толе би — разрушение до июня с вероятностью 87%. Суюнбая: 3 аварии без камер за месяц.",
        action:
          "Отремонтировать топ-3 дороги. Установить камеру на Суюнбая. Усилить патруль в центре.",
        savings: 340_000_000,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <Sidebar />

      <div className="flex flex-col flex-1 min-w-0">
        <TopBar onAnalyze={handleAnalyze} loading={loading} />

        {/* heatmap */}
        <HeatMap />

        {/* two panels */}
        <div className="grid grid-cols-2 flex-1 min-h-0 overflow-hidden">
          <RoadsPanel />
          <CamerasPanel />
        </div>

        {/* AI insight card */}
        <InsightCard insight={insight} loading={loading} />
      </div>
    </div>
  );
}