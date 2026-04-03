import { formatTenge } from "../data/mockData";

function Block({ children, className = "" }) {
  return (
    <div className={`bg-gray-50 border border-gray-200 rounded-lg p-3 ${className}`}>
      {children}
    </div>
  );
}

function BlockLabel({ children }) {
  return (
    <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
      {children}
    </div>
  );
}

function Row({ label, value, valueClass = "text-gray-900" }) {
  return (
    <div className="flex justify-between items-center py-1.5 border-b border-gray-100 last:border-0">
      <span className="text-xs text-gray-500">{label}</span>
      <span className={`text-xs font-medium ${valueClass}`}>{value}</span>
    </div>
  );
}

function ScoreCircle({ score }) {
  const color =
    score >= 70 ? "#E24B4A" : score >= 45 ? "#EF9F27" : "#639922";
  return (
    <div
      className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
      style={{ border: `2px solid ${color}` }}
    >
      <span className="text-sm font-medium" style={{ color }}>
        {score}
      </span>
    </div>
  );
}

export default function CameraDetailPanel({ camera, onClose }) {
  if (!camera) return null;

  const isUnmonitored = camera.status === "UNMONITORED";
  const budgetPct = ((camera.installCost / camera.districtBudget) * 100).toFixed(1);
  const costPerAccidentPrevented = camera.accidentsPrevented
    ? Math.round(camera.installCost / camera.accidentsPrevented)
    : null;

  const linkedRoad = camera.linkedRoadId
    ? { name: "ул. Толе би (центр)", segment: "Достык — Кунаева" }
    : null;

  const hasBehavioralSignal =
    camera.gapDistance > 0 && camera.postCameraViolationsPerMonth > 30;

  const hasAnomalyLowScore =
    camera.score < 65 && camera.accidents >= 4;
  const hasAnomalyNullData =
    camera.status === "ACTIVE" && camera.postCameraViolationsPerMonth === null;

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col shrink-0 overflow-hidden">
      {/* header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-gray-900 leading-tight truncate">
              {camera.name}
            </div>
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">
                {camera.district}
              </span>
              <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">
                {camera.roadClass}
              </span>
              <span
                className={`text-xs px-2 py-0.5 rounded font-medium ${
                  isUnmonitored
                    ? "bg-amber-50 text-amber-700 border border-amber-300"
                    : "bg-green-50 text-green-700 border border-green-300"
                }`}
              >
                {isUnmonitored ? "Не охвачено" : "Активна"}
              </span>
            </div>
          </div>
          <div className="flex flex-col items-center gap-1 shrink-0">
            <ScoreCircle score={camera.score} />
            <span className="text-xs text-gray-400">приоритет</span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-lg leading-none"
        >
          ×
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">

        {/* behavioral signal — loud, first */}
        {hasBehavioralSignal && (
          <div className="bg-amber-50 border border-amber-300 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base">⚠️</span>
              <span className="text-xs font-medium text-amber-800 uppercase tracking-wider">
                Поведенческий сигнал
              </span>
            </div>
            <p className="text-xs text-amber-900 leading-relaxed">
              Водители разгоняются через{" "}
              <span className="font-medium">{camera.gapDistance}м</span> после
              зоны камеры —{" "}
              <span className="font-medium">
                {camera.postCameraViolationsPerMonth} нарушений/мес
              </span>{" "}
              на участке без контроля.
            </p>
            <p className="text-xs text-amber-700 mt-1.5 italic">
              Этот участок фактически не контролируется поведенчески.
            </p>
          </div>
        )}

        {/* revenue block */}
        <Block>
          <BlockLabel>Финансы / ROI</BlockLabel>
          <Row label="Стоимость установки" value={formatTenge(camera.installCost)} />
          <Row
            label="Доход от штрафов / год"
            value={formatTenge(camera.annualRevenue)}
            valueClass="text-green-600"
          />
          <Row label="ROI (год 1)" value={`×${camera.roi.toFixed(2)}`} valueClass="text-blue-600" />
          <Row label="Окупаемость" value={`~${camera.paybackMonths} мес.`} />
          <div className="mt-2 pt-2 border-t border-gray-200">
            <p className="text-xs text-gray-600 font-medium">
              Установить → зарабатывать{" "}
              <span className="text-green-600">
                {formatTenge(camera.annualRevenue)}
              </span>{" "}
              в год
            </p>
          </div>
        </Block>

        {/* safety block */}
        <Block>
          <BlockLabel>Безопасность</BlockLabel>
          <Row label="Аварий в радиусе 500м / год" value={camera.accidents} />
          <Row
            label="Предотвращаемых аварий / год"
            value={`~${camera.accidentsPrevented}`}
            valueClass="text-green-600"
          />
          {costPerAccidentPrevented && (
            <Row
              label="Стоимость предотвращения 1 аварии"
              value={formatTenge(costPerAccidentPrevented)}
            />
          )}
          {camera.postCameraViolationsPerMonth !== null && (
            <Row
              label="Нарушений после зоны / мес"
              value={camera.postCameraViolationsPerMonth}
              valueClass={
                camera.postCameraViolationsPerMonth > 30
                  ? "text-amber-600"
                  : "text-gray-900"
              }
            />
          )}
        </Block>

        {/* brain 2 enrichment */}
        <Block>
          <BlockLabel>Аналитика</BlockLabel>
          <p className="text-xs text-gray-600 leading-relaxed">
            {hasBehavioralSignal
              ? `Высокий показатель нарушений после зоны на соседнем участке указывает: водители осведомлены о пробеле в покрытии. Новая камера закроет известную поведенческую лазейку.`
              : `Камера обеспечивает стабильное покрытие ключевого перекрёстка. Данные о нарушениях соответствуют ожидаемому профилю трафика для ${camera.district} района.`}
          </p>
        </Block>

        {/* anomalies */}
        {(hasAnomalyLowScore || hasAnomalyNullData) && (
          <Block>
            <BlockLabel>Аномалии</BlockLabel>
            {hasAnomalyLowScore && (
              <div className="flex gap-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded p-2 mb-2">
                <span>⚠️</span>
                <span>
                  Низкий приоритетный балл, но аварийность выше среднего по
                  району — оценка занижает реальный риск с вероятностью 79%.
                </span>
              </div>
            )}
            {hasAnomalyNullData && (
              <div className="flex gap-2 text-xs text-red-800 bg-red-50 border border-red-200 rounded p-2">
                <span>⚠️</span>
                <span>
                  Камера помечена как активная, но данные о нарушениях
                  отсутствуют — возможна проблема с потоком данных.
                </span>
              </div>
            )}
          </Block>
        )}

        {/* overlap */}
        {linkedRoad && (
          <Block>
            <BlockLabel>Пересечения</BlockLabel>
            <div className="flex gap-2 text-xs text-blue-800 bg-blue-50 border border-blue-200 rounded p-2">
              <span>🔗</span>
              <span>
                Пересекается с дорожным сегментом{" "}
                <span className="font-medium">{linkedRoad.name}</span> (
                {linkedRoad.segment}) — износ дороги + отсутствие камеры =
                двойной риск.
              </span>
            </div>
          </Block>
        )}
      </div>

      {/* budget context bottom */}
      <div className="p-3 border-t border-gray-200 bg-gray-50">
        <div className="flex justify-between text-xs text-gray-500 mb-1.5">
          <span>Бюджет района использован</span>
          <span className="font-medium text-gray-700">
            {budgetPct}% ({formatTenge(camera.installCost)} /{" "}
            {formatTenge(camera.districtBudget)})
          </span>
        </div>
        <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden mb-3">
          <div
            className="bg-blue-500 h-full rounded-full"
            style={{ width: `${budgetPct}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500 mb-3">
          <span>Позиция в очереди</span>
          <span className="font-medium text-gray-700">
            #{camera.queuePosition} из 6
          </span>
        </div>
        {camera.queuePosition === 1 && (
          <div className="text-xs text-green-700 bg-green-50 border border-green-200 rounded p-2 mb-3 text-center">
            Наивысший ROI в районе
          </div>
        )}
        <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-xs font-medium transition-colors">
          Установить камеру
        </button>
      </div>
    </div>
  );
}