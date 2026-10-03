"use client";
import { MapContainer, TileLayer, CircleMarker, Popup, LayersControl } from "react-leaflet";
import type { LatLngExpression } from "leaflet";

type GaugeSummary = {
  site_id: string; name: string; latitude: number; longitude: number;
  current: { stage_ft: number; category: string };
  risk: { category: string };
};

const CATEGORY_COLOR: Record<string, string> = {
  none: "#4caf82", action: "#ffa600", minor: "#ff9800", moderate: "#e05555", major: "#b91c1c",
};

// USGS National Map tiles (public domain). ArcGIS tile URLs use {z}/{y}/{x} order, not {z}/{x}/{y}.
const USGS = "https://basemap.nationalmap.gov/arcgis/rest/services";
const USGS_ATTRIB = "Hydrography &amp; relief: USGS The National Map";

export default function GaugeMap({ gauges, selectedId, onSelect }: {
  gauges: GaugeSummary[]; selectedId: string | null; onSelect: (id: string) => void;
}) {
  const center: LatLngExpression = [37.2, -80.0];
  return (
    <MapContainer center={center} zoom={7} scrollWheelZoom={false} className="h-full w-full rounded-blob-sm">
      <LayersControl position="topright">
        {/* Default: muted terrain with rivers and lakes drawn on top */}
        <LayersControl.BaseLayer checked name="Rivers &amp; terrain">
          <TileLayer
            attribution={USGS_ATTRIB}
            url={`${USGS}/USGSShadedReliefOnly/MapServer/tile/{z}/{y}/{x}`}
            maxZoom={15}
          />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="Topographic">
          <TileLayer
            attribution={USGS_ATTRIB}
            url={`${USGS}/USGSTopo/MapServer/tile/{z}/{y}/{x}`}
            maxZoom={16}
          />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="Streets">
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
        </LayersControl.BaseLayer>
      </LayersControl>

      {/* Rivers and lakes (National Hydrography Dataset), transparent, always on top of the base layer */}
      <TileLayer
        attribution={USGS_ATTRIB}
        url={`${USGS}/USGSHydroCached/MapServer/tile/{z}/{y}/{x}`}
        opacity={0.9}
        zIndex={400}
      />

      {gauges.map((g) => (
        <CircleMarker
          key={g.site_id}
          center={[g.latitude, g.longitude]}
          radius={g.site_id === selectedId ? 12 : 8}
          pathOptions={{ color: "#17496c", weight: 2, fillColor: CATEGORY_COLOR[g.risk.category] ?? "#4caf82", fillOpacity: 0.9 }}
          eventHandlers={{ click: () => onSelect(g.site_id) }}
        >
          <Popup><strong>{g.name}</strong><br />{g.current.stage_ft.toFixed(2)} ft — {g.risk.category}</Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
