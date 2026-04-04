import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Marker, Polyline, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { interpolateScoreColor } from '../utils/formatters';

// Almaty center coordinates
const ALMATY_CENTER = [43.238, 76.945];
const DEFAULT_ZOOM = 12;

/**
 * Create a custom DivIcon for camera markers
 * @param {Object} camera - Camera object
 * @param {boolean} isSelected - Whether this camera is selected
 * @returns {L.DivIcon}
 */
function createCameraIcon(camera, isSelected) {
  const { is_monitored, is_survivorship_bias_case, is_critical_gap } = camera;
  
  let iconContent;
  let bgColor;
  let borderColor;
  
  if (is_survivorship_bias_case) {
    // Warning triangle for survivorship bias cases
    iconContent = '⚠️';
    bgColor = '#FFC107';
    borderColor = '#FF8F00';
  } else if (is_monitored) {
    // Green checkmark for monitored
    iconContent = '✓';
    bgColor = '#4CAF50';
    borderColor = '#2E7D32';
  } else {
    // Red X for unmonitored
    iconContent = '✕';
    bgColor = '#E53935';
    borderColor = '#B71C1C';
  }
  
  // Critical gap gets dashed border
  const borderStyle = is_critical_gap ? 'dashed' : 'solid';
  
  // Selected state gets glow effect
  const glowStyle = isSelected 
    ? 'box-shadow: 0 0 12px 4px rgba(55, 138, 221, 0.8);' 
    : '';
  
  const html = `
    <div style="
      width: 28px;
      height: 28px;
      background: ${bgColor};
      border: 3px ${borderStyle} ${borderColor};
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 14px;
      font-weight: bold;
      ${glowStyle}
      transition: transform 0.2s, box-shadow 0.2s;
      cursor: pointer;
    ">
      ${iconContent}
    </div>
  `;
  
  return L.divIcon({
    html,
    className: 'camera-marker',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

/**
 * Component to handle map view updates when selection changes
 */
function MapController({ selectedCoords, roads, cameras }) {
  const map = useMap();
  
  useEffect(() => {
    if (selectedCoords) {
      map.flyTo([selectedCoords.lat, selectedCoords.lng], Math.max(map.getZoom(), 14), {
        duration: 0.5,
      });
      return;
    }

    const points = [...(roads || []), ...(cameras || [])]
      .map((item) => item.coordinates)
      .filter(Boolean)
      .map((coords) => [coords.lat, coords.lng]);

    if (points.length === 1) {
      map.flyTo(points[0], 14, { duration: 0.5 });
      return;
    }

    if (points.length > 1) {
      map.flyToBounds(points, {
        padding: [32, 32],
        duration: 0.5,
        maxZoom: 14,
      });
      return;
    }

    map.flyTo(ALMATY_CENTER, DEFAULT_ZOOM, { duration: 0.5 });
  }, [cameras, map, roads, selectedCoords]);
  
  return null;
}

/**
 * Find coordinates for a given entity ID from roads and cameras
 */
function findEntityCoords(entityId, roads, cameras) {
  const road = roads?.find(r => r.segment_id === entityId);
  if (road) return road.coordinates;
  
  const camera = cameras?.find(c => c.intersection_id === entityId);
  if (camera) return camera.coordinates;
  
  return null;
}

/**
 * Build a lookup map for overlap connections
 */
function buildOverlapConnections(overlaps, roads, cameras) {
  if (!overlaps || !roads || !cameras) return [];
  
  const connections = [];
  
  overlaps.forEach(overlap => {
    if (!overlap.overlap_exists) return;
    
    const road = roads.find(r => r.segment_id === overlap.road_segment || r.name === overlap.road_segment);
    const camera = cameras.find(c => c.intersection_id === overlap.camera_zone || c.name === overlap.camera_zone);
    
    if (road && camera && road.coordinates && camera.coordinates) {
      connections.push({
        roadId: road.segment_id,
        cameraId: camera.intersection_id,
        type: overlap.overlap_type,
        positions: [
          [road.coordinates.lat, road.coordinates.lng],
          [camera.coordinates.lat, camera.coordinates.lng],
        ],
      });
    }
  });
  
  return connections;
}

/**
 * MapView Component - Interactive Leaflet map for Almaty Smart City Dashboard
 * Shows roads colored by priority score and camera markers
 */
export default function MapView({
  roads = [],
  cameras = [],
  overlaps = [],
  selectedId = null,
  districtLabel = 'All districts',
  onSelectRoad,
  onSelectCamera,
}) {
  // Memoize overlap connections to avoid recalculating on every render
  const overlapConnections = useMemo(
    () => buildOverlapConnections(overlaps, roads, cameras),
    [overlaps, roads, cameras]
  );
  
  // Get IDs of entities involved in overlaps for highlighting
  const overlapEntityIds = useMemo(() => {
    const ids = new Set();
    overlapConnections.forEach(conn => {
      ids.add(conn.roadId);
      ids.add(conn.cameraId);
    });
    return ids;
  }, [overlapConnections]);
  
  // Find selected entity coordinates for map centering
  const selectedCoords = useMemo(
    () => findEntityCoords(selectedId, roads, cameras),
    [selectedId, roads, cameras]
  );
  
  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={ALMATY_CENTER}
        zoom={DEFAULT_ZOOM}
        className="w-full h-full"
        zoomControl={true}
        attributionControl={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        
        {/* Map controller for selection-based view updates */}
        <MapController selectedCoords={selectedCoords} roads={roads} cameras={cameras} />
        
        {/* Overlap connection lines (render first, lowest z-index) */}
        {overlapConnections.map((conn, idx) => (
          <Polyline
            key={`overlap-${idx}`}
            positions={conn.positions}
            pathOptions={{
              color: '#378ADD',
              weight: 2,
              opacity: 0.7,
              dashArray: '8, 8',
              lineCap: 'round',
            }}
          >
            <Tooltip sticky direction="top">
              <div style={{ fontFamily: 'sans-serif', padding: '2px 4px' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#378ADD' }}>
                  Перекрытие: {conn.type || 'связь'}
                </div>
              </div>
            </Tooltip>
          </Polyline>
        ))}
        
        {/* Road markers */}
        {roads.map(road => {
          if (!road.coordinates) return null;
          
          const isSelected = road.segment_id === selectedId;
          const isOverlapEntity = overlapEntityIds.has(road.segment_id);
          const color = interpolateScoreColor(road.priority_score || 0);
          
          // Larger radius for critical roads
          let radius = 8;
          if (road.is_critical) radius = 12;
          if (isSelected) radius = 14;
          
          // Additional visual indicators
          const weight = isSelected ? 4 : (isOverlapEntity ? 3 : 2);
          const fillOpacity = isSelected ? 1 : (road.is_critical ? 0.9 : 0.7);
          
          return (
            <CircleMarker
              key={road.segment_id}
              center={[road.coordinates.lat, road.coordinates.lng]}
              radius={radius}
              pathOptions={{
                color: isSelected ? '#378ADD' : (isOverlapEntity ? '#378ADD' : color),
                fillColor: color,
                fillOpacity,
                weight,
                // Glow effect for selected road
                className: isSelected ? 'selected-road-marker' : '',
              }}
              eventHandlers={{
                click: () => onSelectRoad && onSelectRoad(road.segment_id),
                mouseover: (e) => {
                  e.target.setStyle({ 
                    fillOpacity: 1, 
                    weight: weight + 2,
                    radius: radius + 2,
                  });
                  e.target.setRadius(radius + 2);
                },
                mouseout: (e) => {
                  e.target.setStyle({ 
                    fillOpacity, 
                    weight,
                  });
                  e.target.setRadius(radius);
                },
              }}
            >
              <Tooltip sticky direction="top">
                <div style={{ fontFamily: 'sans-serif', padding: '4px 8px', minWidth: '150px' }}>
                  <div style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: '#888',
                    textTransform: 'uppercase',
                    marginBottom: 4,
                  }}>
                    {road.name || road.segment_id}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: color }}>
                    Приоритет: {road.priority_score || 0}
                  </div>
                  <div style={{ 
                    fontSize: 10, 
                    color: '#666', 
                    marginTop: 4,
                    display: 'flex',
                    gap: '8px',
                    flexWrap: 'wrap',
                  }}>
                    {road.is_critical && (
                      <span style={{ color: '#E53935', fontWeight: 600 }}>🚨 Критический</span>
                    )}
                    {road.is_high_freeze_risk && (
                      <span style={{ color: '#2196F3', fontWeight: 600 }}>❄️ Риск гололёда</span>
                    )}
                    {road.is_truck_heavy && (
                      <span style={{ color: '#795548', fontWeight: 600 }}>🚚 Грузовой</span>
                    )}
                  </div>
                </div>
              </Tooltip>
            </CircleMarker>
          );
        })}
        
        {/* Camera markers */}
        {cameras.map(camera => {
          if (!camera.coordinates) return null;
          
          const isSelected = camera.intersection_id === selectedId;
          const icon = createCameraIcon(camera, isSelected);
          
          return (
            <Marker
              key={camera.intersection_id}
              position={[camera.coordinates.lat, camera.coordinates.lng]}
              icon={icon}
              eventHandlers={{
                click: () => onSelectCamera && onSelectCamera(camera.intersection_id),
              }}
              zIndexOffset={isSelected ? 1000 : 0}
            >
              <Tooltip sticky direction="top">
                <div style={{ fontFamily: 'sans-serif', padding: '4px 8px', minWidth: '150px' }}>
                  <div style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: '#888',
                    textTransform: 'uppercase',
                    marginBottom: 4,
                  }}>
                    📷 {camera.name || camera.intersection_id}
                  </div>
                  <div style={{ 
                    fontSize: 14, 
                    fontWeight: 700, 
                    color: interpolateScoreColor(camera.priority_score || 0),
                  }}>
                    Приоритет: {camera.priority_score || 0}
                  </div>
                  <div style={{ 
                    fontSize: 11, 
                    marginTop: 4,
                    color: camera.is_monitored ? '#4CAF50' : '#E53935',
                    fontWeight: 600,
                  }}>
                    {camera.is_monitored ? '✓ Мониторинг активен' : '✕ Без мониторинга'}
                  </div>
                  <div style={{ 
                    fontSize: 10, 
                    color: '#666', 
                    marginTop: 4,
                    display: 'flex',
                    gap: '8px',
                    flexWrap: 'wrap',
                  }}>
                    {camera.is_survivorship_bias_case && (
                      <span style={{ color: '#FF8F00', fontWeight: 600 }}>⚠️ Ошибка выжившего</span>
                    )}
                    {camera.is_critical_gap && (
                      <span style={{ color: '#E53935', fontWeight: 600 }}>🔴 Критический пробел</span>
                    )}
                  </div>
                </div>
              </Tooltip>
            </Marker>
          );
        })}
      </MapContainer>

      {/* CSS for pulse animation on selected markers */}
      <style>{`
        .camera-marker {
          background: transparent !important;
          border: none !important;
        }
        
        .selected-road-marker {
          animation: pulse 1.5s ease-in-out infinite;
        }
        
        @keyframes pulse {
          0%, 100% {
            filter: drop-shadow(0 0 4px rgba(55, 138, 221, 0.6));
          }
          50% {
            filter: drop-shadow(0 0 12px rgba(55, 138, 221, 1));
          }
        }
        
        .leaflet-container {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        .leaflet-tooltip {
          background: white;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
          padding: 0;
        }
        
        .leaflet-tooltip-top:before {
          border-top-color: #e0e0e0;
        }
      `}</style>
    </div>
  );
}
