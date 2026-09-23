"use client";

import React from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";

type GeoPoint = {
  name: string;
  lat: number;
  lng: number;
};

export default function SafeRouteMap({
  origin,
  destination,
  directRoute,
  safeRoute,
}: {
  origin: GeoPoint;
  destination: GeoPoint;
  directRoute: [number, number][];
  safeRoute: [number, number][];
}) {
  return (
    <MapContainer
      center={[(origin.lat + destination.lat) / 2, (origin.lng + destination.lng) / 2]}
      zoom={8}
      scrollWheelZoom
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <Polyline
        positions={directRoute}
        pathOptions={{
          color: "#ef4444",
          weight: 7,
          opacity: 0.9,
          dashArray: "10 12",
        }}
      />

      <Polyline
        positions={safeRoute}
        pathOptions={{
          color: "#22c55e",
          weight: 9,
          opacity: 1,
          lineCap: "round",
          lineJoin: "round",
        }}
      />

      <Polyline
        positions={safeRoute}
        pathOptions={{
          color: "#bbf7d0",
          weight: 4,
          opacity: 0.9,
          dashArray: "1 12",
          lineCap: "round",
          lineJoin: "round",
        }}
      />

      <Marker position={[origin.lat, origin.lng]}>
        <Popup>
          <div className="text-xs font-mono text-slate-900">
            <div className="font-bold text-emerald-700">Origin</div>
            <div>{origin.name}</div>
          </div>
        </Popup>
      </Marker>

      <Marker position={[destination.lat, destination.lng]}>
        <Popup>
          <div className="text-xs font-mono text-slate-900">
            <div className="font-bold text-red-700">Destination</div>
            <div>{destination.name}</div>
          </div>
        </Popup>
      </Marker>
    </MapContainer>
  );
}
