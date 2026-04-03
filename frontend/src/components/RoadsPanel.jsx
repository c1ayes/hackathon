import { roadsData, formatTenge } from "../data/mockData";
import { SeverityDot } from "./SeverityDot.jsx";

const MAX_COST = 180_000_000;

function BarRow({ label, fixCost, emergencyCost }) {
  const fixPct = Math.round((fixCost / MAX_COST) * 100);
  const emergencyPct = Math.round((emergencyCost / MAX_COST) * 100);

  return (
    <div className="flex items-center gap-2 mb-1">
      <div className="text-xs text-gray-400 w-20 shrink-0 truncate">{label}</div>
      <div className="flex-1 flex flex-col gap-0.5">
        <div className="h-2 bg-gray-100 rounded-sm overflow-hidden">
          <div className="h-full b-blue-500 rounded-sm" style={{ width: `${fixPct}%` }} />
        </div>
        <div className="h-2 bg-gray-100 rounded-sm overflow-hidden">
          <div className="h-full bg-red-400 rounded-sm" style={{ width: `${emergencyPct}%` }} />
        </div>
      </div>
      <div className="text-right w-10 shrink-0" style={{ fontSize: 10, lineHeight: "1.6" }}>
        <div className="text-gray-400">{Math.round(fixCost / 1_000_000)}</div>
        <div className="text-gray-400">{Math.round(emergencyCost / 1_000_000)}</div>
      </div>
    </div>
  );
}
 


export default function RoadsPanel() {
  return (
    <div className="flex flex-col gap-3 p-3 overflow-y-auto">
      <div className="text-xs font-medium text-gray-400 uppercase tracking-wider">
        Дороги: Рейтинг приоритета ремонта
      </div>

      {/* рейтинг */}
      <div className="flex flex-col gap-1.5">
        {roadsData.map((road, i) => (
          <div
            key={road.id}
            className="bg-white border border-gray-200 rounded-lg px-3 py-2 flex items-center gap-2"
          >
            <SeverityDot score={road.score} />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-gray-900 truncate">
                {i + 1}. {road.name}
              </div>
              <div className="text-xs text-gray-400 mt-0.5">
                Трафик: {road.traffic} · Балл: {road.score}
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-xs font-medium text-gray-900">{road.score}</div>
              <div className="text-xs text-gray-400">
                -{Math.round(road.savings / 1_000_000)}M ₸
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* диаграммки  */}
      <div className="bg-white border border-gray-200 rounded-lg p-3">
        <div className="text-xs text-gray-400 mb-2">
          Плановый vs аварийный ремонт (млн ₸)
        </div>
        {roadsData.map((road) => (
          <BarRow
            key={road.id}
            label={road.name.split("(")[0].trim()}
            fixCost={road.fixCost}
            emergencyCost={road.emergencyCost}
          />
        ))}
        <div className="flex gap-3 mt-2">
          <div className="flex items-center gap-1 text-gray-400" style={{ fontSize: 10 }}>
            <div className="w-2 h-2 bg-blue-500 rounded-sm" />
            Плановый
          </div>
          <div className="flex items-center gap-1 text-gray-400" style={{ fontSize: 10 }}>
            <div className="w-2 h-2 bg-red-400 rounded-sm" />
            Аварийный 
          </div>
        </div>
      </div>
    </div>
  );
}