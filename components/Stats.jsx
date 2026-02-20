import { useState, useEffect } from "react";
import { supabase } from "../supabase";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import * as XLSX from 'xlsx';

export default function Stats() {
  const [stats, setStats] = useState({ totalHours: 0, totalLogs: 0, activeUsers: 0, thisWeekHours: 0, totalFuelLiters: 0, totalFuelCost: 0 });
  const [recentLogs, setRecentLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoursChartData, setHoursChartData] = useState([]);
  const [userActivityData, setUserActivityData] = useState([]);

  useEffect(() => { loadStats(); }, []);

  async function loadStats() {
    setLoading(true);
    try {
      const { data: allLogs } = await supabase.from("daily_logs").select("hours, work_date, user_id");

      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekAgoStr = weekAgo.toISOString().split("T")[0];
      const todayStr = new Date().toISOString().split("T")[0];

      const { data: weekLogs } = await supabase.from("daily_logs").select("hours, user_id").gte("work_date", weekAgoStr).lte("work_date", todayStr);
      const { data: activeUsersData } = await supabase.from("daily_logs").select("user_id").gte("work_date", weekAgoStr).lte("work_date", todayStr);
      const { data: recentLogsData } = await supabase.from("daily_logs").select("id, user_id, site_id, work_date, hours, created_at").order("created_at", { ascending: false }).limit(15);
      const { data: fuelData } = await supabase.from("fuel_logs").select("liters, total_cost").gte("fuel_date", weekAgoStr);

      const userIds = [...new Set(recentLogsData?.map(l => l.user_id) || [])];
      const siteIds = [...new Set(recentLogsData?.map(l => l.site_id).filter(Boolean) || [])];
      const { data: profilesData } = await supabase.from("profiles").select("id, name, email").in("id", userIds);
      const { data: sitesData } = siteIds.length > 0 ? await supabase.from("sites").select("id, name").in("id", siteIds) : { data: [] };

      const pm = new Map(profilesData?.map(p => [p.id, p]) || []);
      const sm = new Map(sitesData?.map(s => [s.id, s]) || []);

      const totalHours = (allLogs || []).reduce((s, l) => s + (Number(l.hours) || 0), 0);
      const thisWeekHours = (weekLogs || []).reduce((s, l) => s + (Number(l.hours) || 0), 0);
      const activeUsers = new Set((activeUsersData || []).map(l => l.user_id)).size;
      const totalFuelLiters = (fuelData || []).reduce((s, f) => s + (f.liters || 0), 0);
      const totalFuelCost = (fuelData || []).reduce((s, f) => s + (f.total_cost || 0), 0);

      setStats({
        totalHours: totalHours.toFixed(1),
        totalLogs: (allLogs || []).length,
        activeUsers,
        thisWeekHours: thisWeekHours.toFixed(1),
        totalFuelLiters: totalFuelLiters.toFixed(0),
        totalFuelCost: totalFuelCost.toFixed(2),
      });

      setRecentLogs((recentLogsData || []).map(l => ({
        ...l, profiles: pm.get(l.user_id) || null, sites: l.site_id ? (sm.get(l.site_id) || null) : null,
      })));

      // Prepare chart data
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split("T")[0];
      const { data: chartLogs } = await supabase.from("daily_logs").select("work_date, hours").gte("work_date", thirtyDaysAgoStr);

      const dateMap = {};
      (chartLogs || []).forEach(log => {
        const date = log.work_date;
        if (!dateMap[date]) dateMap[date] = 0;
        dateMap[date] += Number(log.hours) || 0;
      });
      const chartData = Object.keys(dateMap).sort().map(date => ({ date, hours: dateMap[date] }));
      setHoursChartData(chartData);

      // User activity pie
      const userMap = {};
      (weekLogs || []).forEach(log => {
        const uid = log.user_id;
        if (!userMap[uid]) userMap[uid] = 0;
        userMap[uid] += Number(log.hours) || 0;
      });
      const userActivity = Object.keys(userMap).map(uid => ({ name: pm.get(uid)?.name || uid.slice(0,8), hours: userMap[uid] }));
      setUserActivityData(userActivity);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();

    // Summary stats
    const summaryData = [
      ["Näitaja", "Väärtus"],
      ["Kokku tunde", stats.totalHours],
      ["Kokku logisid", stats.totalLogs],
      ["Aktiivsed kasutajad (nädal)", stats.activeUsers],
      ["Tunde sel nädalal", stats.thisWeekHours],
      ["Kütust liitreid", stats.totalFuelLiters],
      ["Kütuse kulu", stats.totalFuelCost],
    ];
    const summaryWS = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summaryWS, "Kokkuvõte");

    // Recent logs
    const logsData = [
      ["Kasutaja", "Kuupäev", "Asukoht", "Tunnid", "Loodud"],
      ...recentLogs.map(log => [
        log.profiles?.name || log.profiles?.email || "Tundmatu",
        log.work_date,
        log.sites?.name || "",
        log.hours || 0,
        log.created_at ? new Date(log.created_at).toLocaleString("et-EE") : "",
      ])
    ];
    const logsWS = XLSX.utils.aoa_to_sheet(logsData);
    XLSX.utils.book_append_sheet(wb, logsWS, "Viimased logid");

    // Hours chart data
    const hoursData = [
      ["Kuupäev", "Tunnid"],
      ...hoursChartData.map(d => [d.date, d.hours])
    ];
    const hoursWS = XLSX.utils.aoa_to_sheet(hoursData);
    XLSX.utils.book_append_sheet(wb, hoursWS, "Tundide graafik");

    XLSX.writeFile(wb, "statistika.xlsx");
  };

  const exportToCSV = () => {
    const csvData = [
      ["Kasutaja", "Kuupäev", "Asukoht", "Tunnid", "Loodud"],
      ...recentLogs.map(log => [
        log.profiles?.name || log.profiles?.email || "Tundmatu",
        log.work_date,
        log.sites?.name || "",
        log.hours || 0,
        log.created_at ? new Date(log.created_at).toLocaleString("et-EE") : "",
      ])
    ];

    const csvContent = csvData.map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "viimased_logid.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openInGoogleSheets = () => {
    exportToCSV();
    window.open("https://docs.google.com/spreadsheets/create", "_blank");
  };

  if (loading) return (
    <div className="page" style={{ textAlign: "center", paddingTop: "4rem" }}>
      <svg className="spin" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2">
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
      </svg>
    </div>
  );

  return (
    <div className="page">
      <div className="page-header">
        <h1>Statistika</h1>
        <p>Ülevaade tööpäevikutest</p>
      </div>

      <div className="stat-grid">
        {[
          { label: "Kokku tunde", value: stats.totalHours, sub: "Kõik aegade jooksul", color: "var(--primary)" },
          { label: "Sel nädalal", value: `${stats.thisWeekHours}h`, sub: "Viimased 7 päeva", color: "var(--success)" },
          { label: "Aktiivsed töötajad", value: stats.activeUsers, sub: "Viimase nädala jooksul", color: "var(--primary)" },
          { label: "Kokku logisid", value: stats.totalLogs, sub: "Kõik kirjed", color: "var(--text)" },
          { label: "Kütus nädalal", value: `${stats.totalFuelLiters}L`, sub: "Viimased 7 päeva", color: "var(--accent)" },
          { label: "Kütusekulu", value: `€${stats.totalFuelCost}`, sub: "Viimased 7 päeva", color: "var(--warning)" },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-card-label">{s.label}</div>
            <div className="stat-card-value" style={{ color: s.color }}>{s.value}</div>
            <div className="stat-card-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="chart-grid">
        <div className="card">
          <h3 style={{ fontSize: "1.25rem", fontWeight: "700", marginBottom: "1rem" }}>Tundide trend (viimased 30 päeva)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={hoursChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" stroke="var(--text-secondary)" />
              <YAxis stroke="var(--text-secondary)" />
              <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }} />
              <Legend />
              <Line type="monotone" dataKey="hours" stroke="var(--primary)" strokeWidth={3} dot={{ fill: 'var(--primary)' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 style={{ fontSize: "1.25rem", fontWeight: "700", marginBottom: "1rem" }}>Kasutajate aktiivsus (sel nädalal)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={userActivityData} dataKey="hours" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="var(--primary)" label>
                {userActivityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={`hsl(${index * 360 / userActivityData.length}, 70%, 50%)`} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
          <h3 style={{ fontSize: "1rem", fontWeight: "700" }}>Viimased logid</h3>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button onClick={exportToExcel} className="btn btn-primary btn-sm">Ekspordi Excel</button>
            <button onClick={exportToCSV} className="btn btn-secondary btn-sm">Ekspordi CSV</button>
            <button onClick={openInGoogleSheets} className="btn btn-secondary btn-sm">Google Sheets</button>
            <button onClick={loadStats} className="btn btn-secondary btn-sm">Värskenda</button>
          </div>
        </div>

        {recentLogs.length === 0 ? (
          <p style={{ textAlign: "center", padding: "2rem", color: "var(--text-secondary)" }}>Logisid pole</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
            {recentLogs.map(log => (
              <div key={log.id} style={{
                padding: "0.875rem 1rem",
                background: "var(--bg-hover)",
                borderRadius: "var(--radius)",
                border: "1px solid var(--border)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "0.5rem",
              }}>
                <div>
                  <p style={{ fontWeight: "600", fontSize: "0.9rem" }}>
                    {log.profiles?.name || log.profiles?.email || "Tundmatu"}
                  </p>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.125rem" }}>
                    {new Date(log.work_date).toLocaleDateString("et-EE", { weekday: "short", day: "numeric", month: "short" })}
                    {log.sites?.name ? ` · ${log.sites.name}` : ""}
                  </p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontWeight: "700", color: "var(--primary)", fontFamily: "var(--font-mono)" }}>
                    {log.hours || 0}h
                  </span>
                  <p style={{ fontSize: "0.75rem", color: "var(--text-light)" }}>
                    {log.created_at ? new Date(log.created_at).toLocaleTimeString("et-EE", { hour: "2-digit", minute: "2-digit" }) : ""}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}