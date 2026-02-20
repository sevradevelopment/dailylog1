import { useState, useEffect } from "react";
import { supabase } from "../supabase";

const WOOD_TYPES = ["Mänd", "Kuusk", "Kask", "Haab", "Pappel", "Muu"];
const WORK_TYPES = ["Raie", "Transport", "Sorteerimine", "Hakkamine", "Laadimine", "Muu"];
const MACHINES = ["Harvester", "Forwarder", "Hakkur", "Traktor", "Veoauto", "Muu"];
const ADMIN_WORK_TYPES = ["Hakkepuiduvedamine", "Hakkepuidutootmine"];
const VEHICLE_PLATES = ["508HVY", "806VDM", "176MRM", "102GBS", "324MTC", "838VZW", "251GTR", "304RVW", "133LHL"];

// Helper tips for workers - shows random tip each day
const getDailyTip = () => {
  const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
  const tips = [
    "💡 Päevikusse tasub märkida kõik oluline - nii näed oma töö progressi!",
    "⏰ Ära unusta puhkepausi kellaaegu - see on seadusega nõutud!",
    "🚛 Vedajatele: auto numbrimärk ja km on olulised kulude jälgimiseks.",
    "🌲 Hakkurid: puidu kogus m³ on tähtis tootmise planeerimiseks.",
    "📝 Probleemid ja takistused tasub kohe ära märkida - nii saab abi kiiremini!",
    "✅ Kontrolli alati üle, et kõik väljad oleksid täidetud!",
    "🌳 Hea töö algab õigest planeerimisest - märgi kõik ära!",
  ];
  return tips[dayOfYear % tips.length];
};

const ICON_PATHS = {
  check: <path d="M20.285 2l-11.285 11.567-5.286-5.011-3.714 3.716 9 8.728 15-15.285z"/>,
  x: <path d="M18.364 5.636l-3.536 3.536 3.536 3.536-1.414 1.414-3.536-3.536-3.536 3.536-1.414-1.414 3.536-3.536-3.536-3.536 1.414-1.414 3.536 3.536 3.536-3.536z"/>,
  clipboard: <path d="M16 4h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h4V2a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2zm-6 0h4V2H10v2z"/>,
  tree: <path d="M12 2l2.09 4.26L19 7.27l-4 3.9 1.18 6.88L12 15.77l-4.18 2.28L9 11.17 5 7.27l4.91-.01L12 2z"/>,
  calendar: <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z"/>,
  clock: <path d="M12 2l-.5 1.5L10 5l1.5.5L12 7l.5-1.5L14 5l-1.5-.5L12 2zM12 12l-1 3h2l-1-3zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>,
  mapPin: <g><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></g>,
  flag: <path d="M4 21V2h16l-2 5 2 5H4"/>,
  refresh: <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 0 0 4.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 0 1-15.357-2m15.357 2H15"/>,
  save: <g><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17,21 17,13 7,13 7,21"/><polyline points="7,3 7,8 15,8"/></g>,
  barChart: <path d="M12 20V10M18 20V4M6 20v-4"/>,
  users: <g><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></g>,
  factory: <g><path d="M2 20h20v-8a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v8zM10 8V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v4"/><rect x="2" y="14" width="4" height="6"/><rect x="10" y="14" width="4" height="6"/><rect x="18" y="14" width="4" height="6"/></g>,
  trendingUp: <g><path d="M23 6l-9.5 9.5-5-5L1 18"/><path d="M17 6h6v6"/></g>,
  settings: <g><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></g>,
  logOut: <g><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></g>,
  lock: <g><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><circle cx="12" cy="16" r="1"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></g>,
  user: <g><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></g>,
  edit: <g><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></g>,
  search: <g><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></g>,
  ban: <g><circle cx="12" cy="12" r="10"/><path d="M4.93 4.93l14.14 14.14"/></g>,
  trash: <g><polyline points="3,6 5,6 21,6"/><path d="M19,6v14a2,2 0 0 1-2,2H7a2,2 0 0 1-2-2V6m3,0V4a2,2 0 0 1,2-2h4a2,2 0 0 1,2,2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></g>,
};

const Ico = ({ name, size = 18, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    {ICON_PATHS[name]}
  </svg>
);

function SectionHeader({ icon, title }) {
  return (
    <div className="card-section-title">
      {icon}
      {title}
    </div>
  );
}

export default function Today({ session, userRole, onLogout }) {
  const [sites, setSites] = useState([]);
  const [selectedSiteId, setSelectedSiteId] = useState("");
  const [hours, setHours] = useState("");
  const [breakStart, setBreakStart] = useState("");
  const [breakEnd, setBreakEnd] = useState("");
  const [startLocation, setStartLocation] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endLocation, setEndLocation] = useState("");
  const [endTime, setEndTime] = useState("");
  const [cargoType, setCargoType] = useState("");
  const [cargoAmount, setCargoAmount] = useState("");
  const [vehiclePlate, setVehiclePlate] = useState("");
  const [userName, setUserName] = useState("");
  const [locations, setLocations] = useState([]);
  const [adminWorkType, setAdminWorkType] = useState("");
  const [woodType, setWoodType] = useState("");
  const [woodAmount, setWoodAmount] = useState("");
  const [workType, setWorkType] = useState("");
  const [machines, setMachines] = useState([]);
  const [problems, setProblems] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [loadingSites, setLoadingSites] = useState(true);
  const [savedToday, setSavedToday] = useState(false);
  const [dailyTip] = useState(getDailyTip());

  const isDriver = userRole === "vedaja";
  const isHakker = userRole === "hakkur";
  const isAdmin = userRole === "admin";

  function getGreeting() {
    const h = new Date().getHours();
    if (h >= 5 && h < 12) return "Tere hommikust";
    if (h >= 12 && h < 18) return "Tere päevast";
    return "Tere õhtust";
  }

  const todayStr = (() => {
    const t = new Date();
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
  })();

  useEffect(() => {
    async function loadUserName() {
      const { data } = await supabase.from("profiles").select("name").eq("id", session.user.id).single();
      setUserName(data?.name || session.user.email?.split("@")[0] || "Kasutaja");
    }
    loadUserName();
  }, [session]);

  useEffect(() => {
    async function loadLocations() {
      if (isDriver || isAdmin) {
        const { data } = await supabase.from("locations").select("name").order("name");
        setLocations(data?.map(l => l.name) || []);
      }
    }
    loadLocations();
  }, [isDriver, isAdmin]);

  useEffect(() => {
    async function loadSites() {
      if (isDriver || isAdmin) { setLoadingSites(false); return; }
      const { data, error } = await supabase.from("sites").select("id, name").order("name");
      if (!error) {
        setSites(data || []);
        if (data?.length > 0) setSelectedSiteId(data[0].id);
      }
      setLoadingSites(false);
    }
    loadSites();
  }, [isDriver, isAdmin]);

  useEffect(() => {
    async function loadExistingLog() {
      if ((isDriver || isAdmin) && locations.length === 0) return;
      const { data } = await supabase.from("daily_logs").select("*").eq("user_id", session.user.id).eq("work_date", todayStr).single();
      if (data) {
        setSavedToday(true);
        if (!isDriver && !isAdmin) setSelectedSiteId(data.site_id || "");
        setHours(data.hours || "");
        setBreakStart(data.break_start && data.break_start.trim() ? data.break_start : "");
        setBreakEnd(data.break_end && data.break_end.trim() ? data.break_end : "");
        if (isDriver) {
          setStartLocation(data.start_location || "");
          setStartTime(data.start_time || "");
          setEndLocation(data.end_location || "");
          setEndTime(data.end_time || "");
          setCargoType(data.cargo_type || "");
          setCargoAmount(data.cargo_amount || "");
          setVehiclePlate(data.vehicle_plate || "");
        }
        if (isHakker) {
          setWoodType(data.wood_type || "");
          setWoodAmount(data.wood_amount || "");
          setWorkType(data.work_type || "");
          setMachines(data.machines ? data.machines.split(",") : []);
          setProblems(data.problems || "");
        }
        if (isAdmin) {
          setAdminWorkType(data.admin_work_type || "");
          if (data.admin_work_type === "Hakkepuiduvedamine") {
            setStartLocation(data.start_location || "");
            setStartTime(data.start_time || "");
            setEndLocation(data.end_location || "");
            setEndTime(data.end_time || "");
            setCargoType(data.cargo_type || "");
            setCargoAmount(data.cargo_amount || "");
            setVehiclePlate(data.vehicle_plate || "");
          }
          if (data.admin_work_type === "Hakkepuidutootmine") {
            setWoodType(data.wood_type || "");
            setWoodAmount(data.wood_amount || "");
            setProblems(data.problems || "");
          }
        }
      }
    }
    if (session) loadExistingLog();
  }, [session, isDriver, isHakker, isAdmin, locations]);

  function toggleMachine(m) {
    setMachines(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]);
  }

  async function handleSave(e) {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    if (!isDriver && !isAdmin && !selectedSiteId) {
      setMessage("Palun vali objekt"); setMessageType("error"); setLoading(false); return;
    }
    if (isAdmin && !adminWorkType) {
      setMessage("Palun vali töö tüüp"); setMessageType("error"); setLoading(false); return;
    }

    const payload = {
      user_id: session.user.id,
      site_id: (isDriver || isAdmin) ? null : selectedSiteId,
      work_date: todayStr,
      hours: hours ? Number(hours) : null,
      break_start: (breakStart.trim() && breakEnd.trim()) ? breakStart.trim() : null,
      break_end: (breakStart.trim() && breakEnd.trim()) ? breakEnd.trim() : null,
    };

    if (isDriver) {
      Object.assign(payload, {
        start_location: startLocation.trim() || null,
        start_time: startTime.trim() || null,
        end_location: endLocation.trim() || null,
        end_time: endTime.trim() || null,
        cargo_type: cargoType.trim() || null,
        cargo_amount: cargoAmount ? Number(cargoAmount) : null,
        vehicle_plate: vehiclePlate || null,
      });
    }
    if (isHakker) {
      Object.assign(payload, {
        wood_type: woodType || null,
        wood_amount: woodAmount ? Number(woodAmount) : null,
        work_type: workType || null,
        machines: machines.length > 0 ? machines.join(",") : null,
        problems: problems.trim() || null,
      });
    }
    if (isAdmin) {
      payload.admin_work_type = adminWorkType || null;
      if (adminWorkType === "Hakkepuiduvedamine") {
        Object.assign(payload, {
          start_location: startLocation.trim() || null, start_time: startTime.trim() || null,
          end_location: endLocation.trim() || null, end_time: endTime.trim() || null,
          cargo_type: cargoType.trim() || null, cargo_amount: cargoAmount ? Number(cargoAmount) : null,
          vehicle_plate: vehiclePlate || null,
        });
      }
      if (adminWorkType === "Hakkepuidutootmine") {
        Object.assign(payload, {
          wood_type: woodType || null, wood_amount: woodAmount ? Number(woodAmount) : null,
          problems: problems.trim() || null,
        });
      }
    }

    const { error } = await supabase.from("daily_logs").upsert(payload, { onConflict: "user_id,work_date" });
    setLoading(false);

    if (error) {
      setMessage(`Viga: ${error.message}`); setMessageType("error");
    } else {
      setMessage("Päevik salvestatud!"); setMessageType("success");
      setSavedToday(true);
      setTimeout(() => setMessage(""), 4000);
    }
  }

  const dateLabel = new Date().toLocaleDateString("et-EE", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.5rem" }}>
          <div>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.25rem", textTransform: "capitalize" }}>{dateLabel}</p>
            <h1>{getGreeting()}, {userName}!</h1>
          </div>
          {savedToday && (
            <span className="badge badge-green" style={{ marginTop: "0.5rem" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
              Täna salvestatud
            </span>
          )}
        </div>
      </div>

      {message && (
        <div className={`alert ${messageType === "success" ? "alert-success" : "alert-error"}`} style={{ marginBottom: "1.25rem" }}>
          {messageType === "success" ? "✓" : "!"} {message}
        </div>
      )}

      {/* Daily Tip */}
      <div className="card" style={{ background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)", border: "1px solid #fbbf24", marginBottom: "2rem" }}>
        <div style={{ textAlign: "center", padding: "1rem" }}>
          <p style={{ fontSize: "1rem", color: "#92400e", margin: 0, fontWeight: "500" }}>
            {dailyTip}
          </p>
        </div>
      </div>

      <form onSubmit={handleSave}>
        <div className="card">
          {/* Admin: töö tüübi valik */}
          {isAdmin && (
            <div className="card-section">
              <SectionHeader title="Töö tüüp" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>} />
              <div className="chips">
                {ADMIN_WORK_TYPES.map(t => (
                  <button
                    key={t}
                    type="button"
                    className={`chip ${adminWorkType === t ? "selected" : ""}`}
                    onClick={() => {
                      setAdminWorkType(t);
                      setWoodType(""); setWoodAmount(""); setWorkType(""); setMachines([]); setProblems("");
                      setStartLocation(""); setStartTime(""); setEndLocation(""); setEndTime(""); setCargoType(""); setCargoAmount(""); setVehiclePlate("");
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Objekt (töötajale) */}
          {!isDriver && !isAdmin && (
            <div className="card-section">
              <SectionHeader title="Objekt" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>} />
              {loadingSites ? (
                <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Laen objekte...</p>
              ) : (
                <div className="field">
                  <select value={selectedSiteId} onChange={e => setSelectedSiteId(e.target.value)} className="input" required>
                    {sites.length === 0 ? <option value="">Objekte pole</option> : sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Aeg */}
          <div className="card-section">
            <SectionHeader title="Tööaeg" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>} />
            <div className="field">
              <label className="label">Töötunnid</label>
              <input type="number" value={hours} onChange={e => setHours(e.target.value)} min="0" max="24" step="0.5" className="input" placeholder="0" required />
            </div>
            <div className="grid-2">
              <div className="field">
                <label className="label">Puhkepaus algus</label>
                <input type="time" value={breakStart} onChange={e => setBreakStart(e.target.value)} className="input" />
              </div>
              <div className="field">
                <label className="label">Puhkepaus lõpp</label>
                <input type="time" value={breakEnd} onChange={e => setBreakEnd(e.target.value)} className="input" />
              </div>
            </div>
          </div>

          {/* Vedaja väljad */}
          {(isDriver || (isAdmin && adminWorkType === "Hakkepuiduvedamine")) && (
            <div className="card-section">
              <SectionHeader title="Transport" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13" rx="1" /><path d="M16 8h4l3 3v5h-7V8z" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>} />

              <div className="field">
                <label className="label">Auto numbrimärk</label>
                <div className="chips" style={{ marginBottom: "0.75rem" }}>
                  {VEHICLE_PLATES.map(p => (
                    <button key={p} type="button" className={`chip ${vehiclePlate === p ? "selected" : ""}`}
                      onClick={() => setVehiclePlate(vehiclePlate === p ? "" : p)}
                      style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem" }}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid-2">
                <div className="field">
                  <label className="label">Alguspunkt</label>
                  <select value={startLocation} onChange={e => setStartLocation(e.target.value)} className="input">
                    <option value="">— vali —</option>
                    {locations.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label className="label">Lahkumisaeg</label>
                  <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="input" />
                </div>
              </div>

              <div className="grid-2">
                <div className="field">
                  <label className="label">Sihtkoht</label>
                  <select value={endLocation} onChange={e => setEndLocation(e.target.value)} className="input">
                    <option value="">— vali —</option>
                    {locations.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label className="label">Saabumisaeg</label>
                  <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="input" />
                </div>
              </div>

              <div className="grid-2">
                <div className="field">
                  <label className="label">Mida vedas</label>
                  <input type="text" value={cargoType} onChange={e => setCargoType(e.target.value)} className="input" placeholder="Hakkepuit, jne." />
                </div>
                <div className="field">
                  <label className="label">Kogus (m³)</label>
                  <input type="number" value={cargoAmount} onChange={e => setCargoAmount(e.target.value)} className="input" step="0.1" placeholder="0.0" />
                </div>
              </div>
            </div>
          )}

          {/* Hakkuri väljad */}
          {(isHakker || (isAdmin && adminWorkType === "Hakkepuidutootmine")) && (
            <div className="card-section">
              <SectionHeader title="Hakkepuidu tootmine" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 8C8 10 5.9 16.17 3.82 19.85A2 2 0 0 0 5.54 22a2 2 0 0 0 1.85-1.25C9 17 12 14 17 14" /><path d="M17 8l2 2 4-5" /><path d="M4 15.54a10 10 0 0 0 7.47 3.4" /></svg>} />

              <div className="field">
                <label className="label">Puutüüp</label>
                <div className="chips">
                  {WOOD_TYPES.map(t => (
                    <button key={t} type="button" className={`chip ${woodType === t ? "selected" : ""}`} onClick={() => setWoodType(woodType === t ? "" : t)}>{t}</button>
                  ))}
                </div>
              </div>

              <div className="field">
                <label className="label">Kogus (m³)</label>
                <input type="number" value={woodAmount} onChange={e => setWoodAmount(e.target.value)} className="input" step="0.1" placeholder="0.0" />
              </div>

              {isHakker && (
                <>
                  <div className="field">
                    <label className="label">Töö tüüp</label>
                    <div className="chips">
                      {WORK_TYPES.map(t => (
                        <button key={t} type="button" className={`chip ${workType === t ? "selected" : ""}`} onClick={() => setWorkType(workType === t ? "" : t)}>{t}</button>
                      ))}
                    </div>
                  </div>

                  <div className="field">
                    <label className="label">Masinad</label>
                    <div className="chips">
                      {MACHINES.map(m => (
                        <button key={m} type="button" className={`chip ${machines.includes(m) ? "selected" : ""}`} onClick={() => toggleMachine(m)}>{m}</button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <div className="field">
                <label className="label">Probleemid / Takistused</label>
                <textarea value={problems} onChange={e => setProblems(e.target.value)} className="input" placeholder="Kirjelda probleeme..." />
              </div>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || loadingSites || (!isDriver && !isAdmin && !selectedSiteId) || (isAdmin && !adminWorkType)}
            className="btn btn-primary btn-full"
            style={{ marginTop: "0.5rem", fontSize: "1rem" }}
          >
            {loading ? (
              <>
                <svg className="spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                Salvestan...
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg>
                {savedToday ? "Uuenda päevikut" : "Salvesta päevik"}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}