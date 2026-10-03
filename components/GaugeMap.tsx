"use client";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
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

// The relief tiles are grey, so we tint them green for land. The river layer is left untinted
// so water stays blue. Adjust hue-rotate to change the land colour (see the comments below).
const TINT = `
.floodwatch-relief { filter: sepia(0.55) saturate(1.7) hue-rotate(55deg) brightness(1.04) contrast(0.95); }
`;

export default function GaugeMap({ gauges, selectedId, onSelect }: {
  gauges: GaugeSummary[]; selectedId: string | null; onSelect: (id: string) => void;
}) {
  const center: LatLngExpression = [37.2, -80.0];
  return (
    <>
      <style>{TINT}</style>
      <MapContainer center={center} zoom={7} scrollWheelZoom={false}
        className="h-full w-full rounded-blob-sm" style={{ background: "#dbeafe" }}>
        {/* Land: shaded terrain, tinted green by the CSS above */}
        <TileLayer
          attribution={USGS_ATTRIB}
          url={`${USGS}/USGSShadedReliefOnly/MapServer/tile/{z}/{y}/{x}`}
          className="floodwatch-relief"
          maxZoom={15}
        />
        {/* Water: rivers and lakes from the National Hydrography Dataset, drawn on top */}
        <TileLayer
          attribution={USGS_ATTRIB}
          url={`${USGS}/USGSHydroCached/MapServer/tile/{z}/{y}/{x}`}
          opacity={0.95}
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
    </>
  );
}
