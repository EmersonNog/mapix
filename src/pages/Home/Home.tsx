import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "./Home.css";
import { supabase } from "../../lib/supabase";
import CanvasPixelsLayer from "../../components/CanvasPixelsLayer";
import { quantize } from "../../lib/grid";
import type { Pixel, PlaceResponse } from "../../types";
import type { Session } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";

const EDGE_PLACE_URL =
  import.meta.env.VITE_SUPABASE_EDGE_PLACE_URL ??
  import.meta.env.VITE_EDGE_PLACE_URL;

function ClickToPlace({
  color,
  onPlaced,
  session,
}: {
  color: number;
  onPlaced: (p: Pixel) => void;
  session: Session | null;
}) {
  useMapEvents({
    async click(e) {
      if (!session) {
        console.warn("Faça login para pintar.");
        return;
      }

      const res = await fetch(EDGE_PLACE_URL!, {
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

      const text = await res.text();
      let j: PlaceResponse | null = null;
      try {
        j = JSON.parse(text) as PlaceResponse;
      } catch (err) {
        console.error("Erro ao parsear resposta /place", err);
      }
      if (!res.ok || !j || j.ok === false) return;

      onPlaced({ lat: j.lat, lng: j.lng, color: j.color });
    },
  });
  return null;
}

export default function Home() {
  const [pixels, setPixels] = useState<Pixel[]>([]);
  const [color, setColor] = useState<number>(32);
  const [session, setSession] = useState<Session | null>(null);
  const palette = useMemo(() => [...Array(16)].map((_, i) => i * 16), []);
  const navigate = useNavigate();

  // observar sessão (login/logout)
  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data }) => setSession(data.session ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) =>
      setSession(s)
    );
    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  // carregar pixels (leitura pública)
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("pixel_placements")
        .select("lat,lng,color")
        .order("placed_at", { ascending: false })
        .limit(2000);
      if (data) setPixels(data as Pixel[]);

      const channel = supabase
        .channel("pixels")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "pixel_placements" },
          (payload) => {
            const row = payload.new as Record<string, unknown>;
            const r: Pixel = {
              lat: row.lat as number,
              lng: row.lng as number,
              color: row.color as number,
            };
            setPixels((prev) => [r, ...prev]);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    })();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const logged = !!session;

  return (
    <div className="page">
      {/* Mapa em tela cheia atrás */}
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
          <ClickToPlace
            color={color}
            session={session}
            onPlaced={(p) => setPixels((prev) => [p, ...prev])}
          />
        </MapContainer>
      </div>

      {/* Topbar */}
      <header className="topbar">
        <div className="brand">
          <span className="dot" />
          Mapix
        </div>
        <div className="spacer" />
        <div className={`picker ${logged ? "" : "disabled"}`}>
          <span style={{ color: "var(--muted)", fontSize: 13 }}>Cor:</span>
          <div className="palette" role="toolbar" aria-label="Selecionar cor">
            {palette.map((c) => (
              <button
                key={c}
                className="swatch"
                aria-pressed={color === c}
                onClick={() => logged && setColor(c)}
                title={`Cor ${c}`}
                style={{
                  background: `hsl(${((c % 256) * 1.4) % 360} 80% 55%)`,
                }}
              />
            ))}
          </div>
        </div>
        {logged ? (
          <div className="user-badge" style={{ marginLeft: 12 }}>
            <span>Logado</span>
            <button className="auth-btn" onClick={signOut}>
              Sair
            </button>
          </div>
        ) : (
          <button
            className="auth-btn"
            style={{ marginLeft: 12 }}
            onClick={() => navigate("/login")}
          >
            Entrar
          </button>
        )}
      </header>

      {/* HUD */}
      <aside className="hud">
        <h4>Como funciona</h4>
        <p>Clique no mapa para “pintar” um bloco na grade.</p>
        {!logged && <p className="hint">Faça login para liberar a pintura.</p>}
      </aside>
    </div>
  );
}
