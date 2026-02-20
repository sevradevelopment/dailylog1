import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

// --- Icons (same set, kept consistent) ---
const Icons = {
  Today: (p) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" strokeLinecap="round" />
    </svg>
  ),
  Fuel: (p) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
      <path d="M3 22V9a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v13" />
      <path d="M15 7h2a2 2 0 0 1 2 2v3a2 2 0 0 0 2 2h0" />
      <line x1="3" y1="22" x2="17" y2="22" />
      <rect x="6" y="12" width="6" height="5" rx="1" />
      <path d="M19 10v6" strokeLinecap="round" />
    </svg>
  ),
  History: (p) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  ),
  Stats: (p) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  Users: (p) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  Locations: (p) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  ),
  Notifications: (p) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  ),
  Logout: (p) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
};

// Simple logo icon
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

function NavButton({ active, icon: Icon, label, onClick, variant = "default" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "nav-btn",
        active ? "is-active" : "",
        variant === "danger" ? "is-danger" : "",
      ].join(" ")}
    >
      <span className="nav-icon">
        <Icon />
      </span>
      <span className="nav-label">{label}</span>
      {active && <span className="nav-active-pill" aria-hidden="true" />}
    </button>
  );
}

export default function Sidebar({ userRole, onLogout, isMobile, userName }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = userRole === "admin";

  const workerItems = [
    { id: "today", label: "Täna", icon: Icons.Today },
    { id: "fuel", label: "Tankimine", icon: Icons.Fuel },
  ];

  const adminItems = [
    { id: "today", label: "Täna", icon: Icons.Today },
    { id: "fuel", label: "Tankimine", icon: Icons.Fuel },
    { id: "notifications", label: "Teated", icon: Icons.Notifications },
    { id: "admin", label: "Ajalugu", icon: Icons.History },
    { id: "stats", label: "Statistika", icon: Icons.Stats },
    { id: "users", label: "Kasutajad", icon: Icons.Users },
    { id: "locations", label: "Asukohad", icon: Icons.Locations },
  ];

  const menuItems = isAdmin ? adminItems : workerItems;

  const mobileItems = isAdmin
    ? [
        { id: "today", label: "Täna", icon: Icons.Today },
        { id: "fuel", label: "Tank", icon: Icons.Fuel },
        { id: "admin", label: "Ajalugu", icon: Icons.History },
        { id: "stats", label: "Stats", icon: Icons.Stats },
        { id: "users", label: "Users", icon: Icons.Users },
      ]
    : workerItems;

  if (isMobile) {
    return (
      <>
        <header className="m-header">
          <div className="m-brand">
            <div className="brand-badge" aria-hidden="true">
              <Ico name="tree" size={18} />
            </div>
            <div className="m-title">
              <div className="app-name">Tööpäevik</div>
              {userName ? <div className="app-sub">{userName}</div> : <div className="app-sub"> </div>}
            </div>
          </div>
        </header>

        <nav className="m-bottom-nav" aria-label="Põhinavigatsioon">
          {mobileItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={["m-item", location.pathname === (item.id === "today" ? "/" : `/${item.id}`) ? "is-active" : ""].join(" ")}
              onClick={() => navigate(item.id === "today" ? "/" : `/${item.id}`)}
            >
              <item.icon />
              <span>{item.label}</span>
            </button>
          ))}
          <button type="button" className="m-item is-logout" onClick={onLogout}>
            <Icons.Logout />
            <span>Välja</span>
          </button>
        </nav>
      </>
    );
  }

  return (
    <aside className="sb" aria-label="Külgriba">
      <div className="sb-top">
        <div className="sb-brand">
          <div className="brand-badge" aria-hidden="true">
            <Ico name="tree" size={18} />
          </div>
          <div>
            <div className="app-name">Tööpäevik</div>
            {userName ? <div className="app-sub">Tere, {userName}</div> : <div className="app-sub"> </div>}
          </div>
        </div>
      </div>

      <nav className="sb-nav" aria-label="Navigatsioon">
        {menuItems.map((item) => (
          <NavButton
            key={item.id}
            active={location.pathname === (item.id === "today" ? "/" : `/${item.id}`)}
            icon={item.icon}
            label={item.label}
            onClick={() => navigate(item.id === "today" ? "/" : `/${item.id}`)}
          />
        ))}
      </nav>

      <div className="sb-footer">
        <NavButton active={false} icon={Icons.Logout} label="Logi välja" onClick={onLogout} variant="danger" />
      </div>

      {/* Optional: drop this into your global CSS file */}
      <style>{`
        :root{
          --sb-bg: #0b1220;
          --sb-panel: rgba(255,255,255,0.06);
          --sb-border: rgba(255,255,255,0.10);
          --sb-text: rgba(255,255,255,0.92);
          --sb-muted: rgba(255,255,255,0.60);
          --sb-muted2: rgba(255,255,255,0.45);
          --sb-accent: #10b981;
          --sb-accent2: #059669;
          --sb-danger: #f87171;
          --radius-xl: 18px;
          --radius-lg: 14px;
        }

        /* Desktop shell */
        .sb{
          width: 280px;
          height: 100vh;
          position: sticky;
          top: 0;
          padding: 18px 14px;
          background: radial-gradient(1200px 600px at -10% -10%, rgba(16,185,129,0.20), transparent 60%),
                      linear-gradient(180deg, rgba(255,255,255,0.02), transparent 30%),
                      var(--sb-bg);
          border-right: 1px solid var(--sb-border);
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .sb-top{ padding: 6px 6px 10px; }

        .sb-brand{
          display:flex;
          align-items:center;
          gap:12px;
          padding: 12px;
          border: 1px solid var(--sb-border);
          background: rgba(255,255,255,0.04);
          border-radius: var(--radius-xl);
          box-shadow: 0 8px 24px rgba(0,0,0,0.20);
        }

        .brand-badge{
          width: 38px;
          height: 38px;
          border-radius: 12px;
          display:flex;
          align-items:center;
          justify-content:center;
          color: white;
          background: linear-gradient(135deg, var(--sb-accent), var(--sb-accent2));
          box-shadow: 0 10px 24px rgba(16,185,129,0.25);
        }

        .app-name{
          color: var(--sb-text);
          font-weight: 750;
          letter-spacing: 0.2px;
          font-size: 1.05rem;
          line-height: 1.1;
        }

        .app-sub{
          color: var(--sb-muted);
          font-weight: 600;
          margin-top: 4px;
          font-size: 0.86rem;
        }

        .sb-nav{
          display:flex;
          flex-direction:column;
          gap: 6px;
          padding: 6px;
          border-radius: var(--radius-xl);
        }

        .sb-footer{
          margin-top: auto;
          padding: 6px;
          border-top: 1px solid var(--sb-border);
        }

        /* Nav buttons */
        .nav-btn{
          position: relative;
          width: 100%;
          border: 1px solid transparent;
          background: transparent;
          color: var(--sb-text);
          border-radius: var(--radius-lg);
          padding: 10px 10px;
          display:flex;
          align-items:center;
          gap: 10px;
          cursor:pointer;
          transition: transform 120ms ease, background 120ms ease, border-color 120ms ease;
          text-align: left;
        }

        .nav-btn:hover{
          background: rgba(255,255,255,0.06);
          border-color: rgba(255,255,255,0.10);
          transform: translateY(-1px);
        }

        .nav-btn:active{
          transform: translateY(0px) scale(0.99);
        }

        .nav-icon{
          width: 38px;
          height: 38px;
          border-radius: 12px;
          display:flex;
          align-items:center;
          justify-content:center;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          color: rgba(255,255,255,0.82);
        }

        .nav-label{
          font-weight: 700;
          color: rgba(255,255,255,0.86);
          letter-spacing: 0.1px;
        }

        .nav-btn.is-active{
          background: linear-gradient(135deg, rgba(16,185,129,0.18), rgba(5,150,105,0.10));
          border-color: rgba(16,185,129,0.35);
        }

        .nav-btn.is-active .nav-icon{
          background: rgba(16,185,129,0.16);
          border-color: rgba(16,185,129,0.28);
          color: rgba(255,255,255,0.95);
        }

        .nav-active-pill{
          position:absolute;
          right: 10px;
          width: 10px;
          height: 10px;
          border-radius: 999px;
          background: var(--sb-accent);
          box-shadow: 0 0 0 6px rgba(16,185,129,0.12);
        }

        .nav-btn.is-danger{
          color: var(--sb-muted);
        }
        .nav-btn.is-danger:hover{
          background: rgba(248,113,113,0.08);
          border-color: rgba(248,113,113,0.22);
        }
        .nav-btn.is-danger .nav-icon{
          color: rgba(248,113,113,0.95);
          background: rgba(248,113,113,0.10);
          border-color: rgba(248,113,113,0.18);
        }

        /* Mobile header + bottom nav */
        .m-header{
          position: sticky;
          top: 0;
          z-index: 30;
          padding: 12px 14px;
          background: rgba(11,18,32,0.85);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid rgba(255,255,255,0.10);
        }

        .m-brand{
          display:flex;
          align-items:center;
          gap: 12px;
        }
        .m-title{ display:flex; flex-direction:column; gap:2px; }
        
        .m-bottom-nav{
          position: fixed;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 40;
          display: grid;
          grid-auto-flow: column;
          grid-auto-columns: 1fr;
          gap: 6px;
          padding: 10px 10px calc(10px + env(safe-area-inset-bottom));
          background: rgba(11,18,32,0.92);
          backdrop-filter: blur(12px);
          border-top: 1px solid rgba(255,255,255,0.10);
        }

        .m-item{
          border: 1px solid transparent;
          background: transparent;
          color: rgba(255,255,255,0.82);
          border-radius: 14px;
          padding: 10px 8px;
          display:flex;
          flex-direction:column;
          align-items:center;
          justify-content:center;
          gap: 6px;
          font-weight: 700;
          font-size: 0.75rem;
          transition: background 120ms ease, border-color 120ms ease, transform 120ms ease;
        }

        .m-item:hover{
          background: rgba(255,255,255,0.06);
          border-color: rgba(255,255,255,0.10);
        }

        .m-item:active{ transform: scale(0.99); }

        .m-item.is-active{
          background: linear-gradient(135deg, rgba(16,185,129,0.18), rgba(5,150,105,0.10));
          border-color: rgba(16,185,129,0.35);
          color: rgba(255,255,255,0.95);
        }

        .m-item.is-logout{
          color: rgba(248,113,113,0.95);
        }
        .m-item.is-logout:hover{
          background: rgba(248,113,113,0.08);
          border-color: rgba(248,113,113,0.22);
        }
      `}</style>
    </aside>
  );
}
