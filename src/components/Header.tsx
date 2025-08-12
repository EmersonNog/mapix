import type { Session } from "@supabase/supabase-js";
import { getUserInfo } from "../helpers/getUserInfo";
import ColorPicker from "./ColorPicker";

type Props = {
  session: Session | null;
  logged: boolean;
  canPaint: boolean;
  color: number;
  palette: number[];
  swatchColors?: string[];
  onSelectColor: (c: number) => void;
  onSignIn: () => void;
  onSignOut: () => void;
};

export default function Header({
  session,
  logged,
  canPaint,
  color,
  palette,
  swatchColors,
  onSelectColor,
  onSignIn,
  onSignOut,
}: Props) {
  const info = getUserInfo(session);

  return (
    <header className="topbar">
      <div className="brand">
        <span className="dot" />
        Mapix
      </div>

      <div className="spacer" />

      {canPaint && (
        <ColorPicker
          palette={palette}
          value={color}
          onChange={onSelectColor}
          swatchColors={swatchColors}
          initialCount={10}
        />
      )}

      {logged ? (
        <div className="user-badge">
          {info?.avatar ? (
            <img
              src={info.avatar}
              alt={info?.name ?? "avatar"}
              referrerPolicy="no-referrer"
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                objectFit: "cover",
                border: "1px solid var(--border)",
              }}
            />
          ) : (
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                background: "rgba(255,255,255,.08)",
                border: "1px solid var(--border)",
                color: "var(--text)",
                fontWeight: 800,
              }}
              aria-label="avatar"
            >
              {(info?.name ?? "U").charAt(0).toUpperCase()}
            </div>
          )}
          <span>{info?.name}</span>
          <button className="auth-btn" onClick={onSignOut}>
            Sair
          </button>
        </div>
      ) : (
        <button className="auth-btn" onClick={onSignIn}>
          Entrar
        </button>
      )}
    </header>
  );
}
