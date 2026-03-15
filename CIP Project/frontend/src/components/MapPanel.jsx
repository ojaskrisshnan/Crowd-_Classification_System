import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

const busIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export default function MapPanel({ bus, user }) {
  if (!bus || !bus.location) return null;

  const center = [bus.location.lat, bus.location.lng];
  const userPos = user || { lat: 13.0108, lng: 80.2350 }; // near Anna University

  return (
    <div className="mt-4 h-64 overflow-hidden rounded-xl bg-slate-900 ring-1 ring-slate-800">
      <MapContainer center={center} zoom={13} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[userPos.lat, userPos.lng]} icon={busIcon}>
          <Popup>Your location (Anna University / Chennai area)</Popup>
        </Marker>
        <Marker position={center} icon={busIcon}>
          <Popup>Bus {bus.bus_id}</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}

