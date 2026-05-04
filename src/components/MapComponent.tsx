"use client";

import { Report, useReports } from "@/context/ReportContext";
import { Layers2, MapPin, Navigation2, Search } from "lucide-react";
import L from "leaflet";
import "leaflet-defaulticon-compatibility";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import { useEffect, useMemo, useRef, useState } from "react";

const DEFAULT_CENTER: [number, number] = [28.5355, 77.391];
const DEFAULT_ZOOM = 12;

const fallbackReports: Report[] = [
  {
    id: "fallback-1",
    image:
      "data:image/svg+xml;charset=utf-8," +
      encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675"><rect fill="#ef4444" width="1200" height="675"/><text x="70" y="130" font-size="58" font-family="Arial" fill="white">CivicLens</text><text x="70" y="220" font-size="40" font-family="Arial" fill="white">Pothole cluster</text></svg>`
      ),
    lat: 28.6318,
    lng: 77.3729,
    issue_type: "Potholes",
    severity: 4,
    brief_description: "Multiple potholes reported near the main carriageway in Noida.",
    timestamp: Date.now() - 60 * 60 * 1000,
    location: "Noida Sector 18",
    status: "Reported",
    upvotes: 4,
    comments: [],
  },
  {
    id: "fallback-2",
    image:
      "data:image/svg+xml;charset=utf-8," +
      encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675"><rect fill="#3b82f6" width="1200" height="675"/><text x="70" y="130" font-size="58" font-family="Arial" fill="white">CivicLens</text><text x="70" y="220" font-size="40" font-family="Arial" fill="white">Waterlogging</text></svg>`
      ),
    lat: 28.5707,
    lng: 77.321,
    issue_type: "Waterlogging",
    severity: 3,
    brief_description: "Water accumulation reported after rainfall, slowing traffic movement.",
    timestamp: Date.now() - 2 * 60 * 60 * 1000,
    location: "Noida Sector 62",
    status: "In Review",
    upvotes: 2,
    comments: [],
  },
];

interface MapComponentProps {
  onSelectReport?: (report: Report) => void;
  filteredReports?: Report[];
  selectedReportId?: string;
}

function getSeverityColor(severity: number) {
  if (severity >= 5) return "#dc2626";
  if (severity >= 4) return "#f97316";
  if (severity >= 3) return "#f59e0b";
  return "#2563eb";
}

function createMarkerIcon(severity: number, selected: boolean) {
  return L.divIcon({
    className: "custom-leaflet-icon",
    html: `<div style="width:20px;height:20px;border-radius:9999px;background:${getSeverityColor(
      severity
    )};border:3px solid ${selected ? "#1d4ed8" : "#ffffff"};box-shadow:${
      selected ? "0 0 0 4px rgba(37,99,235,0.18)" : "0 8px 18px rgba(15,23,42,0.18)"
    };"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
}

export default function MapComponent({
  onSelectReport,
  filteredReports,
  selectedReportId,
}: MapComponentProps) {
  const { reports } = useReports();
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.CircleMarker | null>(null);
  const streetLayerRef = useRef<L.TileLayer | null>(null);
  const terrainLayerRef = useRef<L.TileLayer | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSatellite, setShowSatellite] = useState(false);

  const displayReports = useMemo(() => {
    if (Array.isArray(filteredReports) && filteredReports.length > 0) return filteredReports;
    if (reports.length > 0) return reports;
    return fallbackReports;
  }, [filteredReports, reports]);

  const visibleReports = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return displayReports;

    return displayReports.filter((report) => {
      const type = report.issue_type.toLowerCase();
      const location = report.location?.toLowerCase() ?? "";
      const description = report.brief_description.toLowerCase();
      return type.includes(query) || location.includes(query) || description.includes(query);
    });
  }, [displayReports, searchQuery]);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      zoomControl: false,
      preferCanvas: true,
    });

    const streetLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    });

    const topoLayer = L.tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", {
      attribution:
        'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, SRTM | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
      maxZoom: 17,
    });

    streetLayer.addTo(map);
    streetLayerRef.current = streetLayer;
    terrainLayerRef.current = topoLayer;
    L.control.zoom({ position: "bottomright" }).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;
    const baseLayers = { Streets: streetLayer, Terrain: topoLayer };
    L.control.layers(baseLayers, undefined, { position: "topright" }).addTo(map);

    const resizeMap = () => map.invalidateSize();
    requestAnimationFrame(resizeMap);
    const timeoutId = window.setTimeout(resizeMap, 200);
    window.addEventListener("resize", resizeMap);

    return () => {
      window.removeEventListener("resize", resizeMap);
      window.clearTimeout(timeoutId);
      map.remove();
      mapInstanceRef.current = null;
      markersLayerRef.current = null;
      userMarkerRef.current = null;
      streetLayerRef.current = null;
      terrainLayerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const streetLayer = streetLayerRef.current;
    const terrainLayer = terrainLayerRef.current;

    if (showSatellite) {
      if (streetLayer && map.hasLayer(streetLayer)) map.removeLayer(streetLayer);
      if (terrainLayer && !map.hasLayer(terrainLayer)) terrainLayer.addTo(map);
    } else {
      if (terrainLayer && map.hasLayer(terrainLayer)) map.removeLayer(terrainLayer);
      if (streetLayer && !map.hasLayer(streetLayer)) streetLayer.addTo(map);
    }
  }, [showSatellite]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();

    if (visibleReports.length === 0) {
      map.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
      return;
    }

    const bounds = L.latLngBounds([]);

    visibleReports.forEach((report) => {
      const marker = L.marker([report.lat, report.lng], {
        icon: createMarkerIcon(report.severity, report.id === selectedReportId),
      });

      marker.bindPopup(
        `<div style="min-width:180px">
          <div style="font-weight:700;color:#111827;margin-bottom:4px">${report.issue_type}</div>
          <div style="font-size:12px;color:#4b5563;margin-bottom:4px">${report.location ?? "Noida"}</div>
          <div style="font-size:12px;color:#374151">Severity ${report.severity}</div>
        </div>`
      );

      marker.on("click", () => {
        onSelectReport?.(report);
      });

      marker.addTo(markersLayer);
      bounds.extend([report.lat, report.lng]);
    });

    if (visibleReports.length === 1) {
      map.setView([visibleReports[0].lat, visibleReports[0].lng], 14);
    } else {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }

    requestAnimationFrame(() => map.invalidateSize());
  }, [onSelectReport, selectedReportId, visibleReports]);

  return (
    <div
      className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-100"
      style={{ position: "relative", width: "100%", height: "500px", minHeight: "500px" }}
    >
      <div ref={mapRef} className="w-full h-full rounded-2xl" />

      <div className="pointer-events-none absolute inset-x-0 top-0 z-[500] flex items-start justify-between gap-3 p-4">
        <div className="pointer-events-auto relative w-80 max-w-[70vw]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Filter issues by type or place..."
            className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-9 pr-4 text-sm shadow-sm placeholder:text-gray-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <div className="pointer-events-auto flex gap-2">
          <button
            type="button"
            onClick={() => {
              const map = mapInstanceRef.current;
              if (!map || !navigator.geolocation) return;

              navigator.geolocation.getCurrentPosition(({ coords }) => {
                const latLng: [number, number] = [coords.latitude, coords.longitude];
                if (userMarkerRef.current) {
                  userMarkerRef.current.setLatLng(latLng);
                } else {
                  userMarkerRef.current = L.circleMarker(latLng, {
                    radius: 8,
                    color: "#2563eb",
                    weight: 3,
                    fillColor: "#60a5fa",
                    fillOpacity: 0.9,
                  }).addTo(map);
                }

                map.flyTo(latLng, 14, { duration: 1 });
              });
            }}
            className="rounded-lg border border-gray-300 bg-white p-2.5 text-gray-600 shadow-sm transition hover:bg-blue-50 hover:text-blue-600"
            title="Use my location"
          >
            <Navigation2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setShowSatellite((value) => !value)}
            className="rounded-lg border border-gray-300 bg-white p-2.5 text-gray-600 shadow-sm transition hover:bg-gray-50"
            title={showSatellite ? "Show streets" : "Show terrain"}
          >
            <Layers2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-4 left-4 z-[500] rounded-xl border border-gray-200 bg-white/95 px-4 py-3 shadow-lg backdrop-blur-sm">
        <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">Issue Severity</h4>
        <div className="flex flex-col gap-2">
          <LegendItem color="#dc2626" label="Critical (5)" />
          <LegendItem color="#f97316" label="High (3-4)" />
          <LegendItem color="#f59e0b" label="Low (1-2)" />
        </div>
        <div className="mt-2 border-t border-gray-100 pt-2 text-[10px] font-medium text-gray-400">
          {visibleReports.length} issue{visibleReports.length !== 1 ? "s" : ""} visible
        </div>
      </div>

      {visibleReports.length > 0 && (
        <div className="pointer-events-none absolute bottom-4 right-4 z-[500] hidden max-w-xs rounded-xl bg-white/95 p-3 shadow-lg backdrop-blur-sm lg:block">
          <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-gray-900">
            <MapPin className="h-4 w-4 text-blue-600" />
            Noida Active Reports
          </div>
          <p className="text-xs text-gray-600">
            Click any marker to update the issue discussion panel instantly.
          </p>
        </div>
      )}
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="h-4 w-4 shrink-0 rounded-full border-2 border-white shadow-sm"
        style={{ backgroundColor: color }}
      />
      <span className="text-xs font-medium text-gray-700">{label}</span>
    </div>
  );
}
