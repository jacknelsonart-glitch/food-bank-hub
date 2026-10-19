"use client";

import { useEffect } from "react";
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from "react-leaflet";
import type { FoodBankWithSessions } from "@/lib/types";

export type MapPoint = { bank: FoodBankWithSessions; open: boolean; subtitle: string };

function FitBounds({ points, me }: { points: MapPoint[]; me: { lat: number; lng: number } | null }) {
  const map = useMap();
  useEffect(() => {
    const coords: [number, number][] = points.map((p) => [p.bank.lat, p.bank.lng]);
    if (me) coords.push([me.lat, me.lng]);
    if (coords.length === 1) map.setView(coords[0], 14);
    else if (coords.length > 1) map.fitBounds(coords, { padding: [30, 30], maxZoom: 15 });
  }, [map, points, me]);
  return null;
}

/** Map of food banks. Green dots are open now. Uses OpenStreetMap tiles, which need no API key. */
export default function BankMap({
  points,
  me,
  onSelect,
}: {
  points: MapPoint[];
  me: { lat: number; lng: number } | null;
  onSelect: (id: number) => void;
}) {
  return (
    <MapContainer center={[54, -2]} zoom={5} scrollWheelZoom={false} className="h-80 w-full rounded-xl border border-border sm:h-96">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {points.map(({ bank, open, subtitle }) => (
        <CircleMarker
          key={bank.id}
          center={[bank.lat, bank.lng]}
          radius={10}
          pathOptions={{ color: "#ffffff", weight: 2, fillColor: open ? "#1f7a4d" : "#6b6b63", fillOpacity: 1 }}
          eventHandlers={{ click: () => onSelect(bank.id) }}
        >
          <Popup>
            <strong>{bank.name}</strong>
            <br />
            {subtitle}
          </Popup>
        </CircleMarker>
      ))}
      {me && <CircleMarker center={[me.lat, me.lng]} radius={7} pathOptions={{ color: "#1d4ed8", fillColor: "#3b82f6", fillOpacity: 1 }} />}
      <FitBounds points={points} me={me} />
    </MapContainer>
  );
}
