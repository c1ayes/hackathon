import { useState } from "react";
import TopBar from "./components/TopBar";
import HeatMap from "./components/HeatMap";
import RoadsPanel from "./components/RoadsPanel";
import CamerasPanel from "./components/CamerasPanel";
import InsightCard from "./components/InsightCard";
import IncidentsPage from "./components/IncidentsPage";
import { roadsData, camerasData } from "./data/mockData";

const navItems = [
  { id: "home", label: "Главная" },
  { id: "incidents", label: "Происшествия" },
];

export default function App() {
  const [page, setPage] = useState("home");
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
    } catch {
      setInsight({
        what: "5 аварийных дорог. Горячая зона жалоб — центр и мкр. Тастак. Слепая зона камер на Суюнбая.",
        critical: "ул. Толе би — разрушение до июня с вероятностью 87%. Суюнбая: 3 аварии без камер за месяц.",
        action: "Отремонтировать топ-3 дороги. Установить камеру на Суюнбая. Усилить патруль в центре.",
        savings: 340_000_000,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-full bg-gray-100 overflow-hidden">
      <aside className="w-44 bg-white border-r border-gray-200 flex flex-col shrink-0">
        <div className="px-4 py-4 border-b border-gray-200">
          <div className="text-xs font-medium text-gray-900 leading-tight">
            Smart City<br />Dashboard
          </div>
          <div className="text-xs text-gray-400 mt-1">Алматы, 2025</div>
        </div>
        <nav className="flex flex-col gap-0.5 py-2">
          {navItems.map((item) => (
            <div
              key={item.id}
              onClick={() => setPage(item.id)}
              className={`flex items-center gap-2 px-4 py-2 text-xs cursor-pointer transition-colors
                ${page === item.id
                  ? "bg-gray-100 text-gray-900 font-medium border-l-2 border-blue-500"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                }`}
            >
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  item.id === "incidents"
                    ? "bg-red-400"
                    : page === item.id
                    ? "bg-blue-500"
                    : "bg-gray-300"
                }`}
              />
              {item.label}
            </div>
          ))}
        </nav>
      </aside>

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {page === "home" && (
          <>
            <TopBar onAnalyze={handleAnalyze} loading={loading} />
            <HeatMap />
            <div className="grid grid-cols-2 flex-1 min-h-0 overflow-hidden">
              <RoadsPanel />
              <CamerasPanel />
            </div>
            <InsightCard insight={insight} loading={loading} />
          </>
        )}
        {page === "incidents" && <IncidentsPage />}
      </div>
    </div>
  );
}