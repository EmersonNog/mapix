import { useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();

  const signInGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        navigate("/");
      }
    });
  }, [navigate]);

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        background: "#0f172a",
        color: "#fff",
      }}
    >
      <h1>Entrar no Mapix</h1>
      <p>Escolha uma forma de login:</p>
      <button
        onClick={signInGoogle}
        style={{
          background: "#fff",
          color: "#000",
          padding: "10px 16px",
          borderRadius: "8px",
          cursor: "pointer",
          border: "none",
          fontSize: "16px",
          marginTop: "12px",
        }}
      >
        Entrar com Google
      </button>
    </div>
  );
}
