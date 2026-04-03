import { Polyline, Tooltip } from "react-leaflet";
import { roadsData } from "../data/mockData";

function roadColor(incidentCount) {
  if (incidentCount >= 10) return "#E24B4A";
  if (incidentCount >= 5) return "#EF9F27";
  return "#639922";
}

export default function RoadsLayer({ highlightRoadId, onSelectRoad }) {
  return (
    <>
      {roadsData.map((road) => {
        const isHighlighted = road.id === highlightRoadId;
        const color = roadColor(road.incidentCount);
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
                  {road.incidentCount} происшествий
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