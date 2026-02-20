import { useState, useEffect, useMemo } from "react";
import { supabase } from "../supabase";
import * as XLSX from 'xlsx';

export default function Admin() {
  const [logs, setLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [filters, setFilters] = useState({ dateFrom: "", dateTo: "", userId: "", siteId: "" });
  const [activeTab, setActiveTab] = useState("overview"); // overview, history, sites
  const [showSiteModal, setShowSiteModal] = useState(false);
  const [newSiteName, setNewSiteName] = useState("");
  const [editingSite, setEditingSite] = useState(null);

  useEffect(() => { loadData(); }, [filters]);

  async function loadData() {
    setLoading(true); setErrorMessage("");
    try {
      const { data: usersData } = await supabase.from("profiles").select("id, name, email, role").order("name");
      setUsers(usersData || []);

      const { data: sitesData } = await supabase.from("sites").select("id, name").order("name");
      setSites(sitesData || []);

      let query = supabase.from("daily_logs").select("*").order("work_date", { ascending: false }).limit(500);
      if (filters.dateFrom) query = query.gte("work_date", filters.dateFrom);
      if (filters.dateTo) query = query.lte("work_date", filters.dateTo);
      if (filters.userId) query = query.eq("user_id", filters.userId);
      if (filters.siteId) query = query.eq("site_id", filters.siteId);

      const { data: logsData, error } = await query;
      if (error) { setErrorMessage(`Viga: ${error.message}`); setLogs([]); setLoading(false); return; }

      const userIds = [...new Set((logsData || []).map(l => l.user_id).filter(Boolean))];
      const siteIds = [...new Set((logsData || []).map(l => l.site_id).filter(Boolean))];

      const { data: profilesData } = userIds.length > 0
        ? await supabase.from("profiles").select("id, name, email").in("id", userIds)
        : { data: [] };

      const { data: sitesLookup } = siteIds.length > 0
        ? await supabase.from("sites").select("id, name").in("id", siteIds)
        : { data: [] };

      const pm = new Map((profilesData || []).map(p => [p.id, p]));
      const sm = new Map((sitesLookup || []).map(s => [s.id, s]));

      setLogs((logsData || []).map(l => ({
        ...l,
        profiles: pm.get(l.user_id) || null,
        sites: l.site_id ? (sm.get(l.site_id) || null) : null,
      })));
    } catch (err) {
      setErrorMessage(`Ootamatu viga: ${err.message}`);
      setLogs([]);
    }
    setLoading(false);
  }

  // Calculate statistics
  const stats = useMemo(() => {
    const totalHours = logs.reduce((s, l) => s + (Number(l.hours) || 0), 0);
    const uniqueUsers = new Set(logs.map(l => l.user_id)).size;
    const uniqueSites = new Set(logs.map(l => l.site_id).filter(Boolean)).size;
    
    // Today's stats
    const today = new Date().toISOString().split("T")[0];
    const todayLogs = logs.filter(l => l.work_date === today);
    const todayHours = todayLogs.reduce((s, l) => s + (Number(l.hours) || 0), 0);
    const todayWorkers = new Set(todayLogs.map(l => l.user_id)).size;
    
    // This week
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoStr = weekAgo.toISOString().split("T")[0];
    const weekLogs = logs.filter(l => l.work_date >= weekAgoStr);
    const weekHours = weekLogs.reduce((s, l) => s + (Number(l.hours) || 0), 0);
    
    return { totalHours, uniqueUsers, uniqueSites, todayHours, todayWorkers, weekHours, todayLogs };
  }, [logs]);

  // Export to CSV
  function exportToCSV() {
    const headers = ["Kuupäev", "Töötaja", "Objekt", "Tunnid", "Puhkepaus", "Algus", "Lõpp", "Auto", "Märkused"];
    const rows = logs.map(log => [
      log.work_date,
      log.profiles?.name || log.profiles?.email || "-",
      log.sites?.name || log.admin_work_type || "-",
      log.hours || "-",
      log.break_start && log.break_end ? `${log.break_start}-${log.break_end}` : "-",
      log.start_location || "-",
      log.end_location || "-",
      log.vehicle_plate || "-",
      log.problems || "-"
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `toopaevik_${filters.dateFrom || "all"}_${filters.dateTo || "today"}.csv`;
    link.click();
  }

  // Export to Excel
  function exportToExcel() {
    const wb = XLSX.utils.book_new();

    const data = [
      ["Kuupäev", "Töötaja", "Objekt", "Tunnid", "Puhkepaus", "Algus", "Lõpp", "Auto", "Märkused"],
      ...logs.map(log => [
        log.work_date,
        log.profiles?.name || log.profiles?.email || "-",
        log.sites?.name || log.admin_work_type || "-",
        log.hours || "-",
        log.break_start && log.break_end ? `${log.break_start}-${log.break_end}` : "-",
        log.start_location || "-",
        log.end_location || "-",
        log.vehicle_plate || "-",
        log.problems || "-"
      ])
    ];

    const ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, "Töölauad");
    XLSX.writeFile(wb, `toopaevik_${filters.dateFrom || "all"}_${filters.dateTo || "today"}.xlsx`);
  }

  // Site management
  async function handleAddSite(e) {
    e.preventDefault();
    if (!newSiteName.trim()) return;
    
    const { error } = await supabase.from("sites").insert({ name: newSiteName.trim() });
    if (error) {
      setErrorMessage(`Viga: ${error.message}`);
    } else {
      setNewSiteName("");
      setShowSiteModal(false);
      loadData();
    }
  }

  async function handleDeleteSite(id, name) {
    if (!confirm(`Kas kustutada objekt "${name}"?`)) return;
    
    const { error } = await supabase.from("sites").delete().eq("id", id);
    if (error) {
      setErrorMessage(`Viga: ${error.message}`);
    } else {
      loadData();
    }
  }

  const totalHours = logs.reduce((s, l) => s + (Number(l.hours) || 0), 0);

  return (
    <div className="page" style={{ maxWidth: "1400px" }}>
      <div className="page-header">
        <h1>📊 Tööpäevikute ülevaade</h1>
        <p>Halda ja vaata kõikide töötajate tegevusi</p>
      </div>

      {errorMessage && (
        <div className="alert alert-error" style={{ marginBottom: "1.25rem" }}>{errorMessage}</div>
      )}

      {/* Tab Navigation */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", borderBottom: "2px solid var(--border)", paddingBottom: "0.5rem" }}>
        {[
          { id: "overview", label: "Ülevaade", icon: "📈" },
          { id: "history", label: "Ajalugu", icon: "📋" },
          { id: "sites", label: "Objektid", icon: "🏗️" },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "0.75rem 1.5rem",
              borderRadius: "var(--radius-md)",
              border: "none",
              background: activeTab === tab.id ? "var(--primary)" : "transparent",
              color: activeTab === tab.id ? "#fff" : "var(--text-secondary)",
              fontWeight: "600",
              cursor: "pointer",
              fontSize: "0.9rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              transition: "all 0.2s"
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <>
          {/* Quick Stats */}
          <div className="stat-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)", marginBottom: "1.5rem" }}>
            <div className="stat-card">
              <div className="stat-card-label">🏃 Täna tööl</div>
              <div className="stat-card-value" style={{ color: "var(--success)" }}>{stats.todayWorkers}</div>
              <div className="stat-card-sub">töötajat</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-label">⏱️ Täna tunde</div>
              <div className="stat-card-value" style={{ color: "var(--primary)" }}>{stats.todayHours.toFixed(1)}h</div>
              <div className="stat-card-sub">kogutund</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-label">📅 See nädal</div>
              <div className="stat-card-value" style={{ color: "var(--accent)" }}>{stats.weekHours.toFixed(1)}h</div>
              <div className="stat-card-sub">tundi nädalas</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-label">📊 Kokku</div>
              <div className="stat-card-value">{totalHours.toFixed(1)}h</div>
              <div className="stat-card-sub">tundi kõikide aegade jooksul</div>
            </div>
          </div>

          {/* Today's Workers */}
          <div className="card" style={{ marginBottom: "1.5rem" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: "700", marginBottom: "1rem" }}>
              👥 Täna töötavad inimesed ({stats.todayLogs.length})
            </h3>
            {stats.todayLogs.length === 0 ? (
              <p style={{ color: "var(--text-secondary)", padding: "1rem" }}>Täna pole veel keegi tööd sisestanud</p>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "1rem" }}>
                {stats.todayLogs.map(log => (
                  <div key={log.id} style={{
                    padding: "1rem",
                    background: "var(--bg-hover)",
                    borderRadius: "var(--radius)",
                    border: "1px solid var(--border)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}>
                    <div>
                      <div style={{ fontWeight: "600" }}>{log.profiles?.name || log.profiles?.email || "Tundmatu"}</div>
                      <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                        {log.sites?.name || log.admin_work_type || "-"}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: "700", color: "var(--primary)", fontFamily: "var(--font-mono)" }}>{log.hours}h</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-light)" }}>
                        {new Date(log.work_date).toLocaleDateString("et-EE")}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* History Tab */}
      {activeTab === "history" && (
        <>
          {/* Filters */}
          <div className="card" style={{ marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>
              <span style={{ fontWeight: "600", fontSize: "0.9rem" }}>Filtrid</span>
              {(filters.dateFrom || filters.dateTo || filters.userId || filters.siteId) && (
                <button className="btn btn-secondary btn-sm" style={{ marginLeft: "auto" }}
                  onClick={() => setFilters({ dateFrom: "", dateTo: "", userId: "", siteId: "" })}>
                  Tühjenda
                </button>
              )}
              <button className="btn btn-primary btn-sm" onClick={exportToCSV} style={{ marginLeft: "0.5rem" }}>
                📥 Ekspordi CSV
              </button>
              <button className="btn btn-primary btn-sm" onClick={exportToExcel} style={{ marginLeft: "0.5rem" }}>
                📊 Ekspordi Excel
              </button>
            </div>
            <div className="grid-2">
              <div className="field">
                <label className="label">Alates</label>
                <input type="date" value={filters.dateFrom} onChange={e => setFilters({ ...filters, dateFrom: e.target.value })} className="input" />
              </div>
              <div className="field">
                <label className="label">Kuni</label>
                <input type="date" value={filters.dateTo} onChange={e => setFilters({ ...filters, dateTo: e.target.value })} className="input" />
              </div>
              <div className="field">
                <label className="label">Töötaja</label>
                <select value={filters.userId} onChange={e => setFilters({ ...filters, userId: e.target.value })} className="input">
                  <option value="">Kõik töötajad</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name || u.email}</option>)}
                </select>
              </div>
              <div className="field">
                <label className="label">Objekt</label>
                <select value={filters.siteId} onChange={e => setFilters({ ...filters, siteId: e.target.value })} className="input">
                  <option value="">Kõik objektid</option>
                  {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="stat-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)", marginBottom: "1.5rem" }}>
            <div className="stat-card">
              <div className="stat-card-label">Kirjeid</div>
              <div className="stat-card-value">{logs.length}</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-label">Kokku tunnid</div>
              <div className="stat-card-value" style={{ color: "var(--primary)" }}>{totalHours.toFixed(1)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-label">Töötajaid</div>
              <div className="stat-card-value">{new Set(logs.map(l => l.user_id)).size}</div>
            </div>
          </div>

          {/* Table */}
          <div className="card">
            {loading ? (
              <div style={{ textAlign: "center", padding: "3rem" }}>
                <svg className="spin" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
              </div>
            ) : logs.length === 0 ? (
              <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-secondary)" }}>
                <p style={{ fontSize: "1rem", fontWeight: "600" }}>Päevikuid ei leitud</p>
                <p style={{ fontSize: "0.875rem", marginTop: "0.25rem" }}>Proovi muuta filtreid</p>
              </div>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Kuupäev</th>
                      <th>Töötaja</th>
                      <th>Objekt / Tüüp</th>
                      <th>Tunnid</th>
                      <th>Puhkeaeg</th>
                      <th>Transport</th>
                      <th>Kogus</th>
                      <th>Auto</th>
                      <th>Probleemid</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map(log => (
                      <tr key={log.id}>
                        <td style={{ whiteSpace: "nowrap", fontFamily: "var(--font-mono)", fontSize: "0.8rem" }}>
                          {new Date(log.work_date).toLocaleDateString("et-EE")}
                        </td>
                        <td style={{ fontWeight: "500", whiteSpace: "nowrap" }}>
                          {log.profiles?.name || log.profiles?.email || "—"}
                        </td>
                        <td>
                          {log.admin_work_type || log.sites?.name || "—"}
                        </td>
                        <td>
                          {log.hours ? (
                            <span style={{ fontWeight: "700", color: "var(--primary)", fontFamily: "var(--font-mono)" }}>
                              {log.hours}h
                            </span>
                          ) : "—"}
                        </td>
                        <td style={{ fontSize: "0.8rem", whiteSpace: "nowrap" }}>
                          {log.break_start && log.break_end ? `${log.break_start}–${log.break_end}` : "—"}
                        </td>
                        <td style={{ fontSize: "0.8rem" }}>
                          {log.start_location && log.end_location
                            ? `${log.start_location} → ${log.end_location}`
                            : log.cargo_type || "—"}
                        </td>
                        <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem" }}>
                          {log.cargo_amount ? `${log.cargo_amount}m³` : "—"}
                        </td>
                        <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem" }}>
                          {log.vehicle_plate || "—"}
                        </td>
                        <td style={{ maxWidth: "200px", fontSize: "0.8rem", color: log.problems ? "var(--danger)" : "var(--text-light)" }}>
                          {log.problems || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {!loading && logs.length > 0 && (
              <div style={{ marginTop: "1rem", fontSize: "0.8rem", color: "var(--text-light)", paddingTop: "0.75rem", borderTop: "1px solid var(--border)" }}>
                Kokku: {logs.length} kirjet · {totalHours.toFixed(1)} tundi
              </div>
            )}
          </div>
        </>
      )}

      {/* Sites Tab */}
      {activeTab === "sites" && (
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: "700" }}>🏗️ Objektide haldus</h3>
            <button className="btn btn-primary btn-sm" onClick={() => setShowSiteModal(true)}>
              + Lisa objekt
            </button>
          </div>
          
          {sites.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-secondary)" }}>
              <p>Objekte pole veel lisatud</p>
              <button className="btn btn-primary" style={{ marginTop: "1rem" }} onClick={() => setShowSiteModal(true)}>
                + Lisa esimene objekt
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {sites.map(site => {
                const siteLogs = logs.filter(l => l.site_id === site.id);
                const siteHours = siteLogs.reduce((s, l) => s + (Number(l.hours) || 0), 0);
                
                return (
                  <div key={site.id} style={{
                    padding: "1.25rem",
                    background: "var(--bg-hover)",
                    borderRadius: "var(--radius)",
                    border: "1px solid var(--border)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}>
                    <div>
                      <div style={{ fontWeight: "600", fontSize: "1rem" }}>{site.name}</div>
                      <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
                        {siteLogs.length} kirjet · {siteHours.toFixed(1)} tundi kokku
                      </div>
                    </div>
                    <button 
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDeleteSite(site.id, site.name)}
                    >
                      Kustuta
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Add Site Modal */}
      {showSiteModal && (
        <div className="dialog-backdrop" onClick={() => setShowSiteModal(false)}>
          <div className="dialog-card animate-scale" onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: "1.25rem", fontWeight: "700", marginBottom: "1.5rem" }}>Lisa uus objekt</h3>
            <form onSubmit={handleAddSite}>
              <div className="field">
                <label className="label">Objekti nimi</label>
                <input 
                  type="text" 
                  className="input" 
                  value={newSiteName}
                  onChange={e => setNewSiteName(e.target.value)}
                  placeholder="Nt: Rae metsatükk, Ahja lõikus..."
                  autoFocus
                />
              </div>
              <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowSiteModal(false)} style={{ flex: 1 }}>
                  Tühista
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Lisa objekt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

