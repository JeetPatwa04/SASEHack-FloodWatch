"use client";
import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import type { LatLngBoundsExpression, LatLngExpression, LatLngTuple } from "leaflet";

type GaugeSummary = {
  site_id: string; name: string; latitude: number; longitude: number;
  current: { stage_ft: number; category: string };
  risk: { category: string };
};

const CATEGORY_COLOR: Record<string, string> = {
  none: "#4caf82", action: "#ffa600", minor: "#ff9800", moderate: "#e05555", major: "#b91c1c",
};

// CARTO Voyager without labels: a coloured street map with no place or building names.
// Public map key from carto.com/basemaps/apikey. It is visible in the browser by design;
// free for non-commercial use up to 5 million tile requests a month.
const CARTO_KEY = "cb1_490v_1_e622bfc64a309167c5086d68";
const CARTO_URL = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png"
  + (CARTO_KEY ? `?key=${CARTO_KEY}` : "");
const CARTO_ATTRIB = "&copy; OpenStreetMap contributors, &copy; CARTO";

// USGS rivers and lakes drawn on top (public domain). ArcGIS URLs use {z}/{y}/{x} order.
const HYDRO_URL = "https://basemap.nationalmap.gov/arcgis/rest/services/USGSHydroCached/MapServer/tile/{z}/{y}/{x}";

// Shown only until the gauges arrive, then FitToGauges takes over.
const FALLBACK_CENTER: LatLngExpression = [37.3, -79.6];
const FALLBACK_ZOOM = 7;

/** Frame the map on the gauges once they load, so it opens on our rivers rather than half the coast. */
function FitToGauges({ gauges }: { gauges: GaugeSummary[] }) {
  const map = useMap();
  const done = useRef(false);
  useEffect(() => {
    if (done.current || gauges.length === 0) return;
    const bounds: LatLngBoundsExpression = gauges.map((g) => [g.latitude, g.longitude] as LatLngTuple);
    map.fitBounds(bounds, { padding: [45, 45], maxZoom: 9 });
    done.current = true;   // only on first load, so panning is not undone by a refresh
  }, [gauges, map]);
  return null;
}

export default function GaugeMap({ gauges, selectedId, onSelect }: {
  gauges: GaugeSummary[]; selectedId: string | null; onSelect: (id: string) => void;
}) {
  return (
    <MapContainer center={FALLBACK_CENTER} zoom={FALLBACK_ZOOM} scrollWheelZoom={false}
      className="h-full w-full rounded-blob-sm" style={{ background: "#dbeafe" }}>
      <FitToGauges gauges={gauges} />
      <TileLayer
        attribution={CARTO_ATTRIB}
        url={CARTO_URL}
        subdomains="abcd"
        maxZoom={20}
      />
      {/* Rivers and lakes, so water stands out more than the base map draws it */}
      <TileLayer
        attribution="Hydrography: USGS The National Map"
        url={HYDRO_URL}
        opacity={0.85}
        maxNativeZoom={16}
        maxZoom={20}
        zIndex={400}
      />
      {gauges.map((g) => (
        <CircleMarker
          key={g.site_id}
          center={[g.latitude, g.longitude]}
          radius={g.site_id === selectedId ? 12 : 8}
          pathOptions={{ color: "#17496c", weight: 2, fillColor: CATEGORY_COLOR[g.risk.category] ?? "#4caf82", fillOpacity: 0.95 }}
          eventHandlers={{ click: () => onSelect(g.site_id) }}
        >
          <Popup><strong>{g.name}</strong><br />{g.current.stage_ft.toFixed(2)} ft — {g.risk.category}</Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
