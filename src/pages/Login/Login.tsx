import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useNavigate } from "react-router-dom";
import "./Login.css";

export default function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate("/");
    });
  }, [navigate]);

  const signInGoogle = async () => {
    try {
      setErr(null);
      setLoading(true);
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/` },
      });
    } catch (e: unknown) {
      if (e instanceof Error) {
        setErr(e.message);
      } else {
        setErr("Falha ao iniciar login");
      }
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="bg-blur" />
      <header className="login-topbar">
        <button className="back-btn" onClick={() => navigate("/")}>
          ← Voltar
        </button>
      </header>

      <main className="login-wrap">
        <section
          className="login-card"
          role="dialog"
          aria-labelledby="login-title"
        >
          <div className="brand">
            <h1 id="login-title">Mapix</h1>
          </div>
          <p className="subtitle">Entre para pintar no mapa em tempo real.</p>

          {err && <div className="alert">{err}</div>}

          <button
            className="google-btn"
            onClick={signInGoogle}
            disabled={loading}
            aria-busy={loading}
          >
            <svg className="g-icon" viewBox="0 0 48 48" aria-hidden="true">
              <path
                fill="#EA4335"
                d="M24 9.5c3.54 0 6.71 1.23 9.21 3.62l6.9-6.9C35.9 2.4 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l8.02 6.23C12.24 13.36 17.67 9.5 24 9.5z"
              />
              <path
                fill="#4285F4"
                d="M46.18 24.55c0-1.55-.14-3.04-.39-4.48H24v8.47h12.47c-.54 2.88-2.17 5.32-4.62 6.97l7.08 5.5c4.14-3.83 6.25-9.47 6.25-16.46z"
              />
              <path
                fill="#FBBC05"
                d="M10.58 19.45l-8.02-6.23C.88 15.76 0 19.75 0 24c0 4.17.85 8.08 2.37 11.61l8.21-6.36C9.81 27.26 9.5 25.67 9.5 24c0-1.93.39-3.76 1.08-5.55z"
              />
              <path
                fill="#34A853"
                d="M24 48c6.48 0 11.93-2.13 15.92-5.79l-7.08-5.5c-2.02 1.37-4.62 2.18-8.84 2.18-6.32 0-11.74-3.86-13.41-9.06l-8.21 6.36C6.3 42.67 14.4 48 24 48z"
              />
              <path fill="none" d="M0 0h48v48H0z" />
            </svg>
            <span>{loading ? "Abrindo Google..." : "Entrar com Google"}</span>
          </button>

          <p className="legal">
            Ao continuar, você concorda com nossos termos e política de
            privacidade.
          </p>
        </section>
      </main>
    </div>
  );
}
