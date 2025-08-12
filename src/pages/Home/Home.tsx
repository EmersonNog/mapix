import { useEffect, useState } from "react";
import { useMapEvents, MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "./Home.css";
import { supabase } from "../../lib/supabase";
import CanvasPixelsLayer from "../../components/CanvasPixelsLayer";
import GridOverlay from "../../components/GridOverlay";
import { quantize } from "../../lib/grid";
import type { Session } from "@supabase/supabase-js";
import type { Pixel } from "../../types";
import Header from "../../components/Header";
import { PALETTE_HEX, PALETTE_VALUES } from "../../helpers/palette";

function ClickToPlace({
  color,
  session,
  enabled,
  onPlaced,
}: {
  color: number;
  session: Session | null;
  enabled: boolean;
  onPlaced: (p: Pixel) => void;
}) {
  useMapEvents({
    async click(e) {
      if (!session || !enabled) return;
      const EDGE_PLACE_URL =
        (import.meta.env.VITE_SUPABASE_EDGE_PLACE_URL as string | undefined) ??
        (import.meta.env.VITE_EDGE_PLACE_URL as string);

      const res = await fetch(EDGE_PLACE_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
        },
        body: JSON.stringify({
          lat: quantize(e.latlng.lat),
          lng: quantize(e.latlng.lng),
          color,
        }),
      });
      const j = await res.json().catch(() => null);
      if (j?.ok) onPlaced({ lat: j.lat, lng: j.lng, color: j.color });
    },
  });
  return null;
}

export default function Home() {
  const [pixels, setPixels] = useState<Pixel[]>([]);
  const [color, setColor] = useState<number>(32);
  const [session, setSession] = useState<Session | null>(null);
  const [painting, setPainting] = useState(false);

  const palette = PALETTE_VALUES;

  // sessão
  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data }) => setSession(data.session ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) =>
      setSession(s)
    );
    return () => sub.subscription.unsubscribe();
  }, []);

  // seed + realtime pixel_placements
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("pixel_placements")
        .select("lat,lng,color")
        .order("placed_at", { ascending: false })
        .limit(5000);
      if (data) setPixels(data as Pixel[]);

      const ch = supabase
        .channel("rt-pixels")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "pixel_placements" },
          (p) => {
            const n = p.new as { lat: number; lng: number; color: number };
            setPixels((prev) =>
              [{ lat: n.lat, lng: n.lng, color: n.color }, ...prev].slice(
                0,
                5000
              )
            );
          }
        )
        .subscribe();
      return () => supabase.removeChannel(ch);
    })();
  }, []);

  const logged = !!session;
  const canPaint = logged && painting; // 👈 só pinta quando o botão ativar

  const signIn = async () =>
    supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/` },
    });
  const signOut = async () => supabase.auth.signOut();

  return (
    <div className={`page ${canPaint ? "can-paint" : ""}`}>
      <div className="map-wrap">
        <MapContainer
          center={[-3.73, -38.52]}
          zoom={12}
          minZoom={2}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />
          <CanvasPixelsLayer pixels={pixels} />
          <GridOverlay show={canPaint} />
          <ClickToPlace
            color={color}
            session={session}
            enabled={canPaint}
            onPlaced={(p) => setPixels((prev) => [p, ...prev])}
          />
        </MapContainer>
      </div>

      {/* Topbar */}
      <Header
        session={session}
        logged={logged}
        canPaint={canPaint}
        color={color}
        palette={palette}
        swatchColors={PALETTE_HEX}
        onSelectColor={setColor}
        onSignIn={signIn}
        onSignOut={signOut}
      />
      {/* FAB "Pintar" */}
      <button
        className={`fab ${canPaint ? "active" : ""}`}
        onClick={() => setPainting((v) => !v)}
        disabled={!logged}
        title={
          logged
            ? canPaint
              ? "Encerrar pintura"
              : "Pintar"
            : "Faça login para pintar"
        }
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M7 16c.55 0 1-.45 1-1v-2h2c.55 0 1-.45 1-1s-.45-1-1-1H8V7c0-.55-.45-1-1-1s-1 .45-1 1v3H3c-.55 0-1 .45-1 1s.45 1 1 1h3v2c0 .55.45 1 1 1zm10.5-4c-.83 0-1.5.67-1.5 1.5V15h-1.5c-.83 0-1.5.67-1.5 1.5S13.67 18 14.5 18H16v1.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V18h1.5c.83 0 1.5-.67 1.5-1.5S19.83 15 19 15h-1.5v-1.5c0-.83-.67-1.5-1.5-1.5z" />
        </svg>
        <span>{canPaint ? "Pintando" : "Pintar"}</span>
      </button>

      {/* Hint */}
      {!logged && (
        <aside className="hud">
          <p className="hint">Faça login para liberar a pintura.</p>
        </aside>
      )}
    </div>
  );
}
