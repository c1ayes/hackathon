import { Polyline, Tooltip } from "react-leaflet";
import { roadsData } from "../data/mockData";

// Score 0–100: green → orange → red
function roadColor(score) {
  const s = Math.max(0, Math.min(100, score));
  if (s >= 70) return "#E53935";
  if (s >= 40) return "#FF9800";
  return "#4CAF50";
}

export default function RoadsLayer({ highlightRoadId, onSelectRoad }) {
  return (
    <>
      {roadsData.map((road) => {
        const isHighlighted = road.id === highlightRoadId;
        const color = roadColor(road.score);
        return (
          <Polyline
            key={road.id}
            positions={road.coords}
            eventHandlers={{
              click: () => onSelectRoad && onSelectRoad(road),
              mouseover: (e) => e.target.setStyle({ weight: 12, opacity: 1 }),
              mouseout: (e) =>
                e.target.setStyle({
                  weight: isHighlighted ? 10 : 7,
                  opacity: isHighlighted ? 1 : 0.7,
                }),
            }}
            pathOptions={{
              color: isHighlighted ? "#378ADD" : color,
              weight: isHighlighted ? 10 : 7,
              opacity: isHighlighted ? 1 : 0.7,
              lineCap: "round",
            }}
          >
            <Tooltip sticky direction="top">
              <div style={{ fontFamily: "sans-serif", padding: "2px 4px" }}>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: "#888",
                    textTransform: "uppercase",
                    marginBottom: 2,
                  }}
                >
                  {road.name}
                </div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>
                  Балл: {road.score}
                </div>
                <div style={{ fontSize: 10, color: "#aaa", marginTop: 2 }}>
                  {road.segment}
                </div>
              </div>
            </Tooltip>
          </Polyline>
        );
      })}
    </>
  );
}