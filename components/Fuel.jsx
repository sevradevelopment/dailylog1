import { useState, useEffect } from "react";
import { supabase } from "../supabase";

const VEHICLE_PLATES = ["508HVY", "806VDM", "176MRM", "102GBS", "324MTC", "838VZW", "251GTR", "304RVW", "133LHL"];
const FUEL_TYPES = ["Diisel", "Bensiin", "AdBlue"];

function getFuelColor(liters) {
  if (liters >= 400) return "#dc2626";
  if (liters >= 200) return "#f59e0b";
  return "#16a34a";
}

export default function Fuel({ session, userRole }) {
  const [vehicle, setVehicle] = useState("");
  const [fuelType, setFuelType] = useState("Diisel");
  const [liters, setLiters] = useState("");
  const [pricePerLiter, setPricePerLiter] = useState("");
  const [odometer, setOdometer] = useState("");
  const [station, setStation] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [userName, setUserName] = useState("");

  const isAdmin = userRole === "admin";

  useEffect(() => {
    async function init() {
      const { data } = await supabase.from("profiles").select("name").eq("id", session.user.id).single();
      setUserName(data?.name || "");
      loadHistory();
    }
    init();
  }, [session]);

  async function loadHistory() {
    setLoadingHistory(true);
    let query = supabase
      .from("fuel_logs")
      .select("*, profiles(name, email)")
      .order("created_at", { ascending: false })
      .limit(isAdmin ? 50 : 20);

    if (!isAdmin) {
      query = query.eq("user_id", session.user.id);
    }

    const { data, error } = await query;
    if (!error) setHistory(data || []);
    setLoadingHistory(false);
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!vehicle) { setMessage("Palun vali auto"); setMessageType("error"); return; }
    if (!liters || Number(liters) <= 0) { setMessage("Palun sisesta tankitud liitrid"); setMessageType("error"); return; }

    setLoading(true);
    setMessage("");

    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    const payload = {
      user_id: session.user.id,
      fuel_date: dateStr,
      vehicle_plate: vehicle,
      fuel_type: fuelType,
      liters: Number(liters),
      price_per_liter: pricePerLiter ? Number(pricePerLiter) : null,
      total_cost: (pricePerLiter && liters) ? Math.round(Number(liters) * Number(pricePerLiter) * 100) / 100 : null,
      odometer: odometer ? Number(odometer) : null,
      station: station.trim() || null,
      notes: notes.trim() || null,
    };

    const { error } = await supabase.from("fuel_logs").insert(payload);
    setLoading(false);

    if (error) {
      setMessage(`Viga: ${error.message}`); setMessageType("error");
    } else {
      setMessage("Tankimine salvestatud!"); setMessageType("success");
      setLiters(""); setPricePerLiter(""); setOdometer(""); setStation(""); setNotes("");
      loadHistory();
      setTimeout(() => setMessage(""), 4000);
    }
  }

  const totalLitersToday = history
    .filter(h => h.fuel_date === new Date().toISOString().split("T")[0])
    .reduce((s, h) => s + (h.liters || 0), 0);

  const totalCostMonth = history
    .filter(h => {
      const d = new Date(h.fuel_date);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((s, h) => s + (h.total_cost || 0), 0);

  return (
    <div className="page">
      <div className="page-header">
        <h1>⛽ Tankimine</h1>
        <p>Kütuse kulutuste jälgimine</p>
      </div>

      {/* Stats */}
      <div className="stat-grid" style={{ marginBottom: "1.5rem" }}>
        <div className="stat-card">
          <div className="stat-card-label">Täna kokku</div>
          <div className="stat-card-value" style={{ color: "var(--primary)" }}>{totalLitersToday.toFixed(0)} L</div>
          <div className="stat-card-sub">Tankitud liitrid</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Kuu kulu</div>
          <div className="stat-card-value" style={{ color: "var(--accent)" }}>€{totalCostMonth.toFixed(0)}</div>
          <div className="stat-card-sub">Käesolev kuu</div>
        </div>
      </div>

      {message && (
        <div className={`alert ${messageType === "success" ? "alert-success" : "alert-error"}`} style={{ marginBottom: "1.25rem" }}>
          {message}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSave}>
        <div className="card" style={{ marginBottom: "1.5rem" }}>
          <div className="card-section">
            <div className="card-section-title">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13" rx="1" /><path d="M16 8h4l3 3v5h-7V8z" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>
              Sõiduk
            </div>
            <div className="chips">
              {VEHICLE_PLATES.map(p => (
                <button key={p} type="button" className={`chip ${vehicle === p ? "selected" : ""}`}
                  onClick={() => setVehicle(vehicle === p ? "" : p)}
                  style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem" }}>
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="card-section">
            <div className="card-section-title">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 22V9a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v13" /><path d="M15 7h2a2 2 0 0 1 2 2v3" /><line x1="3" y1="22" x2="17" y2="22" /><rect x="6" y="12" width="6" height="5" rx="1" /></svg>
              Kütuse andmed
            </div>

            <div className="field">
              <label className="label">Kütuse tüüp</label>
              <div className="chips">
                {FUEL_TYPES.map(t => (
                  <button key={t} type="button" className={`chip ${fuelType === t ? "selected" : ""}`} onClick={() => setFuelType(t)}>{t}</button>
                ))}
              </div>
            </div>

            <div className="grid-2">
              <div className="field">
                <label className="label">Liitrid *</label>
                <input type="number" value={liters} onChange={e => setLiters(e.target.value)} className="input" placeholder="0" step="0.1" min="0" required />
              </div>
              <div className="field">
                <label className="label">Hind/liiter (€)</label>
                <input type="number" value={pricePerLiter} onChange={e => setPricePerLiter(e.target.value)} className="input" placeholder="1.65" step="0.001" min="0" />
              </div>
            </div>

            {liters && pricePerLiter && (
              <div style={{
                padding: "0.75rem 1rem",
                background: "var(--primary-light)",
                borderRadius: "var(--radius-sm)",
                color: "var(--primary-muted)",
                fontWeight: "600",
                fontSize: "0.95rem",
                marginBottom: "1rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem"
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                Kokku: €{(Number(liters) * Number(pricePerLiter)).toFixed(2)}
              </div>
            )}

            <div className="grid-2">
              <div className="field">
                <label className="label">Odomeetri näit (km)</label>
                <input type="number" value={odometer} onChange={e => setOdometer(e.target.value)} className="input" placeholder="12345" step="1" min="0" />
              </div>
              <div className="field">
                <label className="label">Tankla</label>
                <input type="text" value={station} onChange={e => setStation(e.target.value)} className="input" placeholder="Circle K, Neste..." />
              </div>
            </div>

            <div className="field">
              <label className="label">Märkused</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} className="input" rows="2" placeholder="Lisainfo..." />
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary btn-full" style={{ fontSize: "1rem" }}>
            {loading ? (
              <>
                <svg className="spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                Salvestan...
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 22V9a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v13" /><line x1="3" y1="22" x2="17" y2="22" /></svg>
                Salvesta tankimine
              </>
            )}
          </button>
        </div>
      </form>

      {/* History */}
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
          <h3 style={{ fontSize: "1rem", fontWeight: "700" }}>Tankimise ajalugu</h3>
          <button onClick={loadHistory} className="btn btn-secondary btn-sm">Värskenda</button>
        </div>

        {loadingHistory ? (
          <p style={{ color: "var(--text-secondary)", padding: "1rem 0" }}>Laen...</p>
        ) : history.length === 0 ? (
          <p style={{ color: "var(--text-secondary)", padding: "1.5rem 0", textAlign: "center" }}>Tankimisi pole registreeritud</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {history.map(h => (
              <div key={h.id} style={{
                padding: "1rem",
                background: "var(--bg-hover)",
                borderRadius: "var(--radius)",
                border: "1px solid var(--border)",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem", flexWrap: "wrap" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontWeight: "700", fontSize: "0.9rem" }}>{h.vehicle_plate}</span>
                      <span className="badge badge-gray">{h.fuel_type}</span>
                    </div>
                    {isAdmin && (
                      <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                        {h.profiles?.name || h.profiles?.email || "Tundmatu"}
                      </p>
                    )}
                    <p style={{ fontSize: "0.8rem", color: "var(--text-light)", marginTop: "0.25rem" }}>
                      {new Date(h.fuel_date).toLocaleDateString("et-EE")}
                      {h.station ? ` · ${h.station}` : ""}
                      {h.odometer ? ` · ${h.odometer.toLocaleString("et-EE")} km` : ""}
                    </p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: "700", fontSize: "1rem", color: "var(--text)" }}>{h.liters} L</div>
                    {h.total_cost && (
                      <div style={{ fontSize: "0.85rem", color: "var(--accent)", fontWeight: "600" }}>€{h.total_cost.toFixed(2)}</div>
                    )}
                    {h.price_per_liter && (
                      <div style={{ fontSize: "0.75rem", color: "var(--text-light)" }}>€{h.price_per_liter}/L</div>
                    )}
                  </div>
                </div>
                {h.notes && (
                  <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.5rem", paddingTop: "0.5rem", borderTop: "1px solid var(--border)" }}>
                    {h.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}