import React, { useMemo, useState } from "react";
import { supabase } from "../supabase";

const SALT = import.meta.env.VITE_PIN_SALT;

const ICON_PATHS = {
  tree: (
    <path d="M12 2l2.09 4.26L19 7.27l-4 3.9 1.18 6.88L12 15.77l-4.18 2.28L9 11.17 5 7.27l4.91-.01L12 2z" />
  ),
};

const Ico = ({ name, size = 18, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    {ICON_PATHS[name]}
  </svg>
);

function Spinner(props) {
  return (
    <svg className="spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

function AlertError({ children }) {
  return (
    <div className="alert alert-error" role="alert" aria-live="polite">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <span>{children}</span>
    </div>
  );
}

export default function Login() {
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const normalizeEmail = (v) => v.trim().toLowerCase();
  const normalizePin = (v) => v.replace(/\D/g, "").slice(0, 6);

  const getNiceError = (err) => {
    const msg = String(err?.message || err || "");
    if (!msg) return "Sisselogimine ebaõnnestus";

    if (msg.includes("Invalid login credentials")) {
      const base = "Vale e-post või PIN. Palun proovi uuesti.";
      if (import.meta.env.DEV) {
        return base + " (Dev: kontrolli, et kasutaja on loodud väärtusega PIN+SALT ja et VITE_PIN_SALT on õige.)";
      }
      return base;
    }
    if (msg.toLowerCase().includes("network")) return "Võrguviga. Palun kontrolli internetti ja proovi uuesti.";
    if (msg.toLowerCase().includes("timeout")) return "Ühendus aegus. Palun proovi uuesti.";
    return msg;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");

    const eMail = normalizeEmail(email);
    const p = normalizePin(pin);

    if (!eMail || !eMail.includes("@")) {
      setMessage("Palun sisesta kehtiv e-posti aadress");
      return;
    }

    if (!p || p.length < 4) {
      setMessage("PIN-kood peab olema vähemalt 4 numbrit");
      return;
    }

    if (!SALT) {
      setMessage("Seadistusviga: PIN-sool (VITE_PIN_SALT) puudub. Võta ühendust administraatoriga.");
      return;
    }

    if (!supabase) {
      setMessage("Seadistusviga: Supabase klient puudub. Kontrolli keskkonnamuutujaid.");
      return;
    }

    setLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: eMail,
        password: `${p}${SALT}`,
      });
      if (authError) throw authError;

      // Disabled check
      if (authData?.user?.id) {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("disabled, name")
          .eq("id", authData.user.id)
          .single();

        if (profileError) {
          await supabase.auth.signOut();
          throw new Error("Viga kasutaja andmete laadimisel");
        }

        if (profile?.disabled) {
          await supabase.auth.signOut();
          throw new Error("Sinu konto on keelatud. Võta ühendust administraatoriga.");
        }
      }

      // Success – App.jsx navigeerib
    } catch (error) {
      console.error("Login error:", error);
      setMessage(getNiceError(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        {/* Brand */}
        <div className="login-brand">
          <div className="brand-badge" aria-hidden="true">
            <Ico name="tree" size={44} />
          </div>
          <h1 className="brand-title">Tööpäevik</h1>
          <p className="brand-sub">Logi sisse oma kontole</p>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          <div className="field">
            <label className="label" htmlFor="email">
              E-posti aadress
            </label>
            <input
              id="email"
              type="email"
              className="input"
              placeholder="nimi@ettevõte.ee"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (message) setMessage("");
              }}
              disabled={loading}
              autoComplete="email"
              autoFocus
            />
          </div>

          <div className="field">
            <label className="label" htmlFor="pin">
              PIN-kood (ainult numbrid)
            </label>
            <input
              id="pin"
              type="password"
              className="input input-pin"
              placeholder="4–6 numbrit"
              inputMode="numeric"
              pattern="[0-9]*"
              value={pin}
              onChange={(e) => {
                setPin(normalizePin(e.target.value));
                if (message) setMessage("");
              }}
              disabled={loading}
              maxLength={6}
              autoComplete="one-time-code"
            />
          </div>

          {message && <AlertError>{message}</AlertError>}

          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? (
              <>
                <Spinner />
                <span>Sisenen…</span>
              </>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                  <polyline points="10 17 15 12 10 7" />
                  <line x1="15" y1="12" x2="3" y2="12" />
                </svg>
                <span>Sisene</span>
              </>
            )}
          </button>
        </form>

        <div className="login-footer">
          <p>Probleemide korral võta ühendust administraatoriga</p>
        </div>
      </div>

      {/* CSS (tõsta soovi korral eraldi faili) */}
      <style>{`
        :root{
          --bg: #0b1220;
          --panel: rgba(255,255,255,0.06);
          --border: rgba(255,255,255,0.10);
          --text: rgba(255,255,255,0.92);
          --text-secondary: rgba(255,255,255,0.65);
          --text-tertiary: rgba(255,255,255,0.45);
          --primary: #3b82f6;
          --primary2: #1d4ed8;
          --danger: #f87171;
          --radius-xl: 22px;
          --radius-lg: 16px;
          --shadow: 0 18px 50px rgba(0,0,0,0.35);
        }

        .login-page{
          min-height: 100vh;
          display:flex;
          align-items:center;
          justify-content:center;
          padding: 28px 14px;
          background:
            radial-gradient(1100px 600px at 12% -10%, rgba(59,130,246,0.22), transparent 60%),
            radial-gradient(900px 500px at 110% 10%, rgba(16,185,129,0.14), transparent 55%),
            var(--bg);
          color: var(--text);
        }

        .login-card{
          width: min(440px, 100%);
          border: 1px solid var(--border);
          background: rgba(255,255,255,0.05);
          border-radius: var(--radius-xl);
          box-shadow: var(--shadow);
          padding: 28px 22px 18px;
          backdrop-filter: blur(10px);
        }

        .login-brand{
          text-align:center;
          margin-bottom: 22px;
        }

        .brand-badge{
          width: 76px;
          height: 76px;
          border-radius: 20px;
          margin: 0 auto 14px;
          display:flex;
          align-items:center;
          justify-content:center;
          background: linear-gradient(135deg, var(--primary), var(--primary2));
          box-shadow: 0 14px 36px rgba(59,130,246,0.35);
        }

        .brand-title{
          margin: 0;
          font-size: 1.9rem;
          letter-spacing: -0.02em;
          font-weight: 850;
        }

        .brand-sub{
          margin: 8px 0 0;
          color: var(--text-secondary);
          font-weight: 600;
        }

        .login-form{ display:flex; flex-direction:column; gap: 14px; }

        .field{ display:flex; flex-direction:column; gap: 8px; }

        .label{
          font-size: 0.9rem;
          color: var(--text-secondary);
          font-weight: 700;
        }

        .input{
          width: 100%;
          padding: 12px 14px;
          border-radius: var(--radius-lg);
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(0,0,0,0.22);
          color: var(--text);
          outline: none;
          font-size: 1rem;
          transition: border-color 120ms ease, transform 120ms ease, background 120ms ease;
        }

        .input::placeholder{ color: rgba(255,255,255,0.40); font-weight: 600; }

        .input:focus{
          border-color: rgba(59,130,246,0.55);
          background: rgba(0,0,0,0.28);
        }

        .input:disabled{
          opacity: 0.65;
          cursor: not-allowed;
        }

        .input-pin{
          font-size: 1.55rem;
          letter-spacing: 0.28em;
          text-align: center;
          padding: 12px 16px;
        }

        .alert{
          display:flex;
          gap: 10px;
          align-items:flex-start;
          padding: 12px 12px;
          border-radius: 16px;
          border: 1px solid rgba(248,113,113,0.30);
          background: rgba(248,113,113,0.10);
          color: rgba(255,255,255,0.92);
          font-weight: 650;
        }

        .btn{
          display:flex;
          gap: 10px;
          align-items:center;
          justify-content:center;
          border: 1px solid transparent;
          border-radius: 16px;
          padding: 12px 14px;
          cursor:pointer;
          font-weight: 800;
          font-size: 1.02rem;
          transition: transform 120ms ease, filter 120ms ease, border-color 120ms ease;
          user-select:none;
        }
        .btn:active{ transform: scale(0.99); }
        .btn:disabled{ opacity: 0.7; cursor: not-allowed; }

        .btn-full{ width: 100%; }

        .btn-primary{
          color: white;
          background: linear-gradient(135deg, var(--primary), var(--primary2));
          box-shadow: 0 14px 34px rgba(59,130,246,0.25);
        }
        .btn-primary:hover{ filter: brightness(1.04); }

        .login-footer{
          margin-top: 18px;
          padding-top: 14px;
          border-top: 1px solid var(--border);
          text-align:center;
          color: var(--text-tertiary);
          font-weight: 600;
          font-size: 0.82rem;
        }

        .spin{
          animation: spin 1s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
