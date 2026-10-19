"use client";

import L from "leaflet";
import { useEffect, useRef } from "react";
import type { FoodBankWithSessions } from "@/lib/types";

export type MapPoint = { bank: FoodBankWithSessions; open: boolean; subtitle: string };

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

/**
 * Map of food banks. Green dots are open now. Uses OpenStreetMap tiles, which need no API key.
 * Leaflet is driven directly (not through react-leaflet) so the map is created and removed
 * exactly once per mount, which keeps it stable under React Strict Mode in development.
 */
export default function BankMap({
  points,
  me,
  onSelect,
}: {
  points: MapPoint[];
  me: { lat: number; lng: number } | null;
  onSelect: (id: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const onSelectRef = useRef(onSelect);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    const map = L.map(containerRef.current!, { center: [54, -2], zoom: 5, scrollWheelZoom: false });
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);
    mapRef.current = map;
    layerRef.current = L.layerGroup().addTo(map);
    return () => {
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;
    layer.clearLayers();

    const coords: L.LatLngTuple[] = [];
    for (const { bank, open, subtitle } of points) {
      coords.push([bank.lat, bank.lng]);
      L.circleMarker([bank.lat, bank.lng], {
        radius: 10,
        color: "#ffffff",
        weight: 2,
        fillColor: open ? "#1f7a4d" : "#6b6b63",
        fillOpacity: 1,
      })
        .bindPopup(`<strong>${escapeHtml(bank.name)}</strong><br>${escapeHtml(subtitle)}`)
        .on("click", () => onSelectRef.current(bank.id))
        .addTo(layer);
    }
    if (me) {
      coords.push([me.lat, me.lng]);
      L.circleMarker([me.lat, me.lng], { radius: 7, color: "#1d4ed8", fillColor: "#3b82f6", fillOpacity: 1 }).addTo(layer);
    }

    if (coords.length === 1) map.setView(coords[0], 14, { animate: false });
    else if (coords.length > 1) map.fitBounds(coords, { padding: [30, 30], maxZoom: 15, animate: false });
  }, [points, me]);

  return <div ref={containerRef} className="h-80 w-full rounded-xl border border-border sm:h-96" />;
}
