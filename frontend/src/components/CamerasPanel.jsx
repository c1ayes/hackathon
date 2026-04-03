import { camerasData } from "../data/mockData";

const MAX_REVENUE = 18_000_000;


function CameraRow({ camera, index }) {
  const dotColor = camera.gap
    ? "bg-amber-400"
    : camera.accidents >= 3
    ? "bg-red-500"
    : "bg-green-500";

  const borderStyle = camera.gap ? "border-amber-300" : "border-gray-200";

  return (
    <div className={`bg-white border rounded-lg px-3 py-2 flex items-center gap-2 ${borderStyle}`}>
      <span className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`} />
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-gray-900 truncate">
          {index + 1}. {camera.name}
          {camera.gap && <span className="text-amber-500 ml-1">⚠</span>}
        </div>
        <div className="text-xs text-gray-400 mt-0.5">
          {camera.gap
            ? "неохваченный участок"
            : `нарушений: ${camera.violations} · аварий: ${camera.accidents}`}
        </div>
      </div>
      <div className="text-right shrink-0">
        <div className="text-xs font-medium text-gray-900">×{camera.roi.toFixed(1)}</div>
        <div className="text-xs text-gray-400">
          {Math.round(camera.revenue / 1_000_000)}млн ₸/г
        </div>
      </div>
    </div>
  );
}


export default function CamerasPanel() {
  return (
    <div className="flex flex-col gap-3 p-3 overflow-y-auto border-l border-gray-200">
      <div className="text-xs font-medium text-gray-400 uppercase tracking-wider">
        Камеры
      </div>

      {/* рейтинг камер */}
      <div className="flex flex-col gap-1.5">
        {camerasData.map((cam, i) => (
          <CameraRow key={cam.id} camera={cam} index={i} />
        ))}
      </div>

      {/* штрафы чарт */}
      <div className="bg-white border border-gray-200 rounded-lg p-3">
        <div className="text-xs text-gray-400 mb-2">
          Потенциальный доход от штрафов (млн ₸/год)
        </div>
        {camerasData.map((cam) => {
          const pct = Math.round((cam.revenue / MAX_REVENUE) * 100);
          const barColor = cam.gap ? "bg-amber-400" : "bg-blue-500";
          return (
            <div key={cam.id} className="flex items-center gap-2 mb-1">
              <div className="text-xs text-gray-400 w-20 shrink-0 truncate">
                {cam.name.split("/")[0].trim()}
              </div>
              <div className="flex-1 h-2.5 bg-gray-100 rounded-sm overflow-hidden">
                <div
                  className={`h-full rounded-sm ${barColor}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="text-xs text-gray-400 w-7 text-right shrink-0">
                {Math.round(cam.revenue / 1_000_000)}M
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}