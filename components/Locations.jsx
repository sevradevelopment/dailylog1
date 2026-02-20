import { useState, useEffect } from "react";
import { supabase } from "../supabase";
import ConfirmDialog from "./ConfirmDialog";

export default function Locations() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newLocation, setNewLocation] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: "", message: "", type: "danger", onConfirm: null });

  useEffect(() => { loadLocations(); }, []);

  async function loadLocations() {
    setLoading(true);
    const { data, error } = await supabase.from("locations").select("id, name").order("name");
    if (error) { setMessage(`Viga: ${error.message}`); setMessageType("error"); }
    else setLocations(data || []);
    setLoading(false);
  }

  async function handleAdd(e) {
    e.preventDefault();
    if (!newLocation.trim()) { setMessage("Palun sisesta asukoha nimi"); setMessageType("error"); return; }
    const { error } = await supabase.from("locations").insert({ name: newLocation.trim() });
    if (error) { setMessage(`Viga: ${error.message}`); setMessageType("error"); }
    else { setMessage("Asukoht lisatud!"); setMessageType("success"); setNewLocation(""); loadLocations(); setTimeout(() => setMessage(""), 3000); }
  }

  async function handleDelete(id, name) {
    setConfirmDialog({
      isOpen: true, title: "Kustuta asukoht", type: "danger",
      message: `Kas oled kindel, et tahad kustutada asukohta "${name}"?`,
      onConfirm: async () => {
        const { error } = await supabase.from("locations").delete().eq("id", id);
        if (error) { setMessage(`Viga: ${error.message}`); setMessageType("error"); }
        else { setMessage("Asukoht kustutatud!"); setMessageType("success"); loadLocations(); setTimeout(() => setMessage(""), 3000); }
      },
    });
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Asukohtade haldamine</h1>
        <p>Vedaja alguspunktide ja sihtkohtade valikud</p>
      </div>

      {message && (
        <div className={`alert ${messageType === "success" ? "alert-success" : "alert-error"}`} style={{ marginBottom: "1.25rem" }}>
          {message}
        </div>
      )}

      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <h3 style={{ fontSize: "1rem", fontWeight: "700", marginBottom: "1rem" }}>Lisa uus asukoht</h3>
        <form onSubmit={handleAdd} style={{ display: "flex", gap: "0.75rem" }}>
          <input type="text" className="input" value={newLocation} onChange={e => setNewLocation(e.target.value)} placeholder="Nt: Tallinn, Tartu..." style={{ flex: 1 }} />
          <button type="submit" className="btn btn-primary" style={{ whiteSpace: "nowrap" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            Lisa
          </button>
        </form>
      </div>

      <div className="card">
        <h3 style={{ fontSize: "1rem", fontWeight: "700", marginBottom: "1.25rem" }}>
          Olemasolevad asukohad
          <span style={{ marginLeft: "0.75rem", fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: "500" }}>
            ({locations.length})
          </span>
        </h3>
        {loading ? (
          <p style={{ color: "var(--text-secondary)" }}>Laen...</p>
        ) : locations.length === 0 ? (
          <p style={{ textAlign: "center", padding: "2rem", color: "var(--text-secondary)" }}>Asukohti pole</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {locations.map(loc => (
              <div key={loc.id} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "0.875rem 1rem", background: "var(--bg-hover)",
                borderRadius: "var(--radius-sm)", border: "1px solid var(--border)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                  <span style={{ fontWeight: "500" }}>{loc.name}</span>
                </div>
                <button onClick={() => handleDelete(loc.id, loc.name)} className="btn btn-danger btn-sm">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                  Kustuta
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        onConfirm={confirmDialog.onConfirm || (() => {})}
        title={confirmDialog.title}
        message={confirmDialog.message}
        type={confirmDialog.type}
      />
    </div>
  );
}