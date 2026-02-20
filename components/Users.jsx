import { useState, useEffect } from "react";
import { supabase } from "../supabase";
import ConfirmDialog from "./ConfirmDialog";

const SALT = import.meta.env.VITE_PIN_SALT;

const IconUser = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const IconPlus = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const IconEdit = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const IconSearch = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8" />
    <path d="M21 21l-4.35-4.35" />
  </svg>
);

const IconBan = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
  </svg>
);

const IconTrash = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const ICON_PATHS = {
  check: <path d="M20.285 2l-11.285 11.567-5.286-5.011-3.714 3.716 9 8.728 15-15.285z"/>,
  x: <path d="M18.364 5.636l-3.536 3.536 3.536 3.536-1.414 1.414-3.536-3.536-3.536 3.536-1.414-1.414 3.536-3.536-3.536-3.536 1.414-1.414 3.536 3.536 3.536-3.536z"/>,
  clipboard: <path d="M16 4h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h4V2a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2zm-6 0h4V2H10v2z"/>,
};

const Ico = ({ name, size = 18, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    {ICON_PATHS[name]}
  </svg>
);

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [currentUserId, setCurrentUserId] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: "", message: "", type: "danger", onConfirm: null });

  // Uue kasutaja vorm
  const [newUser, setNewUser] = useState({
    email: "",
    name: "",
    pin: "",
    role: "worker",
  });

  useEffect(() => {
    loadUsers();
    loadCurrentUser();
  }, []);

  async function loadCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
    }
  }

  async function loadUsers() {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, name, role, disabled")
      .order("name");

    if (error) {
      console.error("Error loading users:", error);
      setMessage({ type: 'error', text: `Viga: ${error.message}` });
    } else {
      setUsers(data || []);
    }
    setLoading(false);
  }

  async function getCurrentUserRole() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    
    const { data } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    
    return data?.role || null;
  }

  async function handleAddUser(e) {
    e.preventDefault();
    setMessage("");

    if (!newUser.email || !newUser.pin) {
      setMessage({ type: 'error', text: "Palun täida kõik väljad" });
      return;
    }

    if (newUser.pin.length < 4) {
      setMessage({ type: 'error', text: "PIN peab olema vähemalt 4 numbrit" });
      return;
    }

    setLoading(true);
    setMessage({ type: 'info', text: "Kontrollin kasutajat..." });

    const email = newUser.email.trim().toLowerCase();
    const password = `${newUser.pin}${SALT}`;

    try {
      // Kontrolli kas profiil on juba olemas
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id, email")
        .eq("email", email)
        .single();

      if (existingProfile) {
        setMessage({ type: 'error', text: `Kasutaja ${email} on juba olemas!` });
        setLoading(false);
        loadUsers();
        return;
      }

      // Genereeri kasutaja andmed
      const userData = {
        email: email,
        password: password,
        name: newUser.name.trim() || "",
        role: newUser.role,
      };

      // Kopeeri andmed lõikelauale
      await navigator.clipboard.writeText(JSON.stringify(userData, null, 2));
      
      // Näita juhiseid koos "Lisa profiil" nupuga
      const instructions = `Kasutaja andmed kopeeritud lõikelauale!

Email: ${email}
Password: ${password}

Kasutaja tuleb luua Supabase Dashboard'is:
1. Mine Authentication → Users → Add user
2. Kleepi email ja password
3. Kliki "Create user"
4. Kopeeri UID ja kliki allpool "Lisa profiil"`;

      setMessage({ type: 'info', text: instructions });
      // Ära sulge vormi, et kasutaja saaks pärast profiili lisada
      // Vorm jääb avatuks, et kasutaja saaks pärast Supabase'is kasutaja loomist kohe profiili lisada
      
    } catch (err) {
      setMessage({ type: 'error', text: `Viga: ${err.message}` });
    }
    
    setLoading(false);
  }

  async function handleAddProfile() {
    // Kui vorm on täidetud, kasuta neid andmeid
    let uid = "";
    let email = newUser.email.trim().toLowerCase();
    let name = newUser.name.trim();
    let role = newUser.role || "worker";

    // Kui email on vormis, siis proovi leida kasutaja emaili järgi
    if (email) {
      // Kuna me ei saa otse Authentication'ist kasutajat leida, küsime UID
      uid = prompt(`Sisesta kasutaja UID (Supabase Authentication → Users → ${email} → UID):`);
    } else {
      email = prompt("Sisesta kasutaja email:")?.trim().toLowerCase() || "";
      if (!email) {
        return;
      }
      uid = prompt("Sisesta kasutaja UID (Supabase Authentication → Users → UID):");
    }

    if (!uid || !uid.trim()) {
      return;
    }

    if (!email) {
      email = prompt("Sisesta kasutaja email:")?.trim().toLowerCase() || "";
      if (!email) {
        return;
      }
    }

    setLoading(true);
    setMessage({ type: 'info', text: "Kontrollin ja lisamas profiili..." });

    try {
      // Kontrolli kas profiil on juba olemas
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id, email")
        .eq("id", uid.trim())
        .single();

      if (existingProfile) {
        setMessage({ type: 'error', text: "Profiil on juba olemas!" });
        setLoading(false);
        loadUsers();
        return;
      }

      // Lisa profiil
      const { error } = await supabase
        .from("profiles")
        .insert({
          id: uid.trim(),
          email: email,
          name: name || null,
          role: role,
          disabled: false,
        });

      if (error) {
        setMessage({ type: 'error', text: `Viga profiili lisamisel: ${error.message}` });
      } else {
        setMessage({ type: 'success', text: "Profiil lisatud edukalt! Kasutaja saab nüüd sisse logida." });
        setNewUser({ email: "", name: "", pin: "", role: "worker" });
        setShowAddForm(false);
        loadUsers();
        setTimeout(() => {
          setMessage("");
        }, 5000);
      }
    } catch (err) {
      setMessage({ type: 'error', text: `Viga: ${err.message}` });
    }

    setLoading(false);
  }

  async function handleUpdateRole(userId, newRole) {
    // Kontrolli, kas kasutaja üritab muuta enda rolli
    if (userId === currentUserId) {
      setMessage({ type: 'error', text: "Sa ei saa enda rolli muuta" });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("id", userId);

    if (error) {
      setMessage({ type: 'error', text: `Viga: ${error.message}` });
    } else {
      setMessage({ type: 'success', text: "Roll uuendatud" });
      loadUsers();
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  }

  async function handleResetPassword(userId, email) {
    // Lihtne input dialog - võib hiljem muuta kohandatud dialoogiks
    const newPin = prompt("Sisesta uus PIN kasutajale:");
    if (!newPin || newPin.trim() === "") return;

    // Märkus: supabase.auth.admin ei tööta client-side'is
    setMessage(
      `⚠️ PIN reset nõuab Supabase admin õigusi.\n\n` +
      `Mine Supabase Dashboard → Authentication → Users\n` +
      `Vali kasutaja ${email}\n` +
      `Kliki "Reset password"\n` +
      `Uus parool: ${newPin}${SALT}`
    );
    
    // Kopeeri uus parool lõikelauale
    navigator.clipboard.writeText(`${newPin}${SALT}`);
    setTimeout(() => setMessage(""), 8000);
  }

  async function handleToggleDisabled(userId, email, currentDisabled) {
    // Kontrolli, kas kasutaja üritab keelustada enda
    if (userId === currentUserId) {
      setMessage({ type: 'error', text: "Sa ei saa enda keelustada" });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({ disabled: !currentDisabled })
      .eq("id", userId);

    if (error) {
      setMessage({ type: 'error', text: `Viga: ${error.message}` });
    } else {
      setMessage({ type: 'success', text: `${!currentDisabled ? "Keelatud" : "Lubatud"} kasutaja ${email}` });
      loadUsers();
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  }

  async function handleDeleteUser(userId, email) {
    // Kontrolli, kas kasutaja üritab kustutada enda
    if (userId === currentUserId) {
      setMessage("⚠️ Sa ei saa enda kustutada");
      setTimeout(() => setMessage(""), 3000);
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: "Kustuta kasutaja",
      message: `Kas oled kindel, et tahad kustutada kasutaja "${email}"?\n\nSee toiming on pöördumatu!`,
      type: "danger",
      onConfirm: async () => {
        // Kustuta profiil
        const { error: profileError } = await supabase
          .from("profiles")
          .delete()
          .eq("id", userId);

        if (profileError) {
          setMessage(`Viga profiili kustutamisel: ${profileError.message}`);
          return;
        }

        setMessage({ type: 'success', text: `Kasutaja ${email} kustutatud\n\nMärkus: Authentication kasutaja tuleb kustutada käsitsi Supabase Dashboard'ist.` });
        loadUsers();
        setTimeout(() => setMessage(""), 5000);
      },
    });
  }

  const filteredUsers = users.filter(
    (user) =>
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const roleColors = {
    admin: "#ef4444",
    vedaja: "#3b82f6",
    hakkur: "#10b981",
    worker: "#64748b",
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: "0.5rem" }}>
            Kasutajate haldamine
          </h1>
          <p style={{ color: "var(--text-light)" }}>Halda kasutajaid ja nende õigusi</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn btn-primary"
          style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
        >
          <IconPlus />
          Lisa kasutaja
        </button>
      </div>

      {/* Tagasiside */}
      {message.text && (
        <div
          className="card fade-in"
          style={{
            marginBottom: "1.5rem",
            padding: "1.5rem",
            backgroundColor: message.type === 'success' ? 'var(--success-light)' : message.type === 'info' ? 'var(--info-light)' : 'var(--danger-light)',
            color: message.type === 'success' ? 'var(--text)' : message.type === 'info' ? 'var(--text)' : 'var(--text)',
            border: `2px solid ${message.type === 'success' ? 'var(--success)' : message.type === 'info' ? 'var(--info)' : 'var(--danger)'}`,
            whiteSpace: "pre-line",
            lineHeight: "1.6",
            fontSize: "1rem",
            display: "flex",
            alignItems: "flex-start",
            gap: "0.5rem",
          }}
        >
          {message.type === 'success' && <Ico name="check" size={20} />}
          {message.type === 'error' && <Ico name="x" size={20} />}
          {message.type === 'info' && <Ico name="clipboard" size={20} />}
          <span>{message.text}</span>
          {message.type === 'info' && (
            <div style={{ marginTop: "1.5rem", paddingTop: "1.5rem", borderTop: "2px solid var(--info)", width: "100%" }}>
              <p style={{ marginBottom: "1rem", fontWeight: "600" }}>Pärast kasutaja loomist Supabase'is:</p>
              <button
                onClick={handleAddProfile}
                className="btn btn-primary"
                style={{ 
                  fontSize: "1.125rem", 
                  padding: "1rem 2rem",
                  fontWeight: "600",
                }}
              >
                <IconPlus />
                Lisa profiil (kleepi UID)
              </button>
            </div>
          )}
        </div>
      )}

      {/* Uue kasutaja vorm */}
      {showAddForm && (
        <div className="card" style={{ marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: "600", marginBottom: "1.5rem" }}>Lisa uus kasutaja</h2>
          <form onSubmit={handleAddUser}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1rem", marginBottom: "1rem" }}>
              <div>
                <label className="label label-large">Email *</label>
                <input
                  type="email"
                  className="input input-large"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value.toLowerCase() })}
                  placeholder="nimi@ktp.ee"
                  required
                  style={{ fontSize: "1.125rem", padding: "1rem" }}
                />
              </div>
              <div>
                <label className="label label-large">Nimi</label>
                <input
                  type="text"
                  className="input input-large"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  placeholder="Ees- ja perekonnanimi"
                  style={{ fontSize: "1.125rem", padding: "1rem" }}
                />
              </div>
              <div>
                <label className="label label-large">PIN *</label>
                <input
                  type="text"
                  className="input input-large"
                  value={newUser.pin}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "");
                    setNewUser({ ...newUser, pin: value });
                  }}
                  placeholder="4-6 numbrit"
                  inputMode="numeric"
                  maxLength={6}
                  required
                  style={{ fontSize: "1.125rem", padding: "1rem", letterSpacing: "0.125rem" }}
                />
              </div>
              <div>
                <label className="label label-large">Roll</label>
                <select
                  className="input input-large"
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  style={{ fontSize: "1.125rem", padding: "1rem" }}
                >
                  <option value="worker">Töötaja</option>
                  <option value="vedaja">Vedaja</option>
                  <option value="hakkur">Hakkur</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={loading}
                style={{ fontSize: "1.125rem", padding: "1rem 2rem", fontWeight: "600" }}
              >
                {loading ? "Genereerin..." : "Genereeri kasutaja andmed"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setNewUser({ email: "", name: "", pin: "", role: "worker" });
                  setMessage("");
                }}
                className="btn btn-secondary"
                style={{ fontSize: "1.125rem", padding: "1rem 2rem" }}
              >
                Tühista
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Otsing */}
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <IconSearch />
          <input
            type="text"
            className="input"
            style={{ flex: 1 }}
            placeholder="Otsi emaili või nime järgi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Kasutajate tabel */}
      <div className="card">
        {loading ? (
          <p>Laen kasutajaid...</p>
        ) : filteredUsers.length === 0 ? (
          <p style={{ textAlign: "center", padding: "2rem", color: "var(--text-light)" }}>
            {searchTerm ? "Kasutajaid ei leitud" : "Kasutajaid pole"}
          </p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--border)" }}>
                  <th style={{ padding: "0.75rem", textAlign: "left", fontWeight: "600" }}>Email</th>
                  <th style={{ padding: "0.75rem", textAlign: "left", fontWeight: "600" }}>Nimi</th>
                  <th style={{ padding: "0.75rem", textAlign: "left", fontWeight: "600" }}>Roll</th>
                  <th style={{ padding: "0.75rem", textAlign: "left", fontWeight: "600" }}>Staatus</th>
                  <th style={{ padding: "0.75rem", textAlign: "left", fontWeight: "600" }}>Tegevused</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr 
                    key={user.id} 
                    style={{ 
                      borderBottom: "1px solid var(--border)",
                      opacity: user.disabled ? 0.6 : 1,
                    }}
                  >
                    <td style={{ padding: "0.75rem" }}>
                      {user.email}
                      {user.disabled && (
                        <span style={{ marginLeft: "0.5rem", color: "var(--danger)", fontSize: "0.875rem" }}>
                          (Keelatud)
                        </span>
                      )}
                    </td>
                    <td style={{ padding: "0.75rem" }}>{user.name || "-"}</td>
                    <td style={{ padding: "0.75rem" }}>
                      <select
                        value={user.role || "worker"}
                        onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                        disabled={user.disabled || user.id === currentUserId}
                        title={user.id === currentUserId ? "Sa ei saa enda rolli muuta" : ""}
                        style={{
                          padding: "0.5rem",
                          borderRadius: "0.5rem",
                          border: "1px solid var(--border)",
                          backgroundColor: roleColors[user.role] || "#64748b",
                          color: "white",
                          fontWeight: "500",
                          cursor: (user.disabled || user.id === currentUserId) ? "not-allowed" : "pointer",
                          opacity: (user.disabled || user.id === currentUserId) ? 0.6 : 1,
                        }}
                      >
                        <option value="worker">Töötaja</option>
                        <option value="vedaja">Vedaja</option>
                        <option value="hakkur">Hakkur</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td style={{ padding: "0.75rem" }}>
                      <span
                        style={{
                          padding: "0.25rem 0.75rem",
                          borderRadius: "var(--radius-sm)",
                          fontSize: "0.875rem",
                          fontWeight: "500",
                          backgroundColor: user.disabled ? "var(--danger-light)" : "var(--success-light)",
                          color: user.disabled ? "#991b1b" : "#065f46",
                        }}
                      >
                        {user.disabled ? "Keelatud" : "Aktiivne"}
                      </span>
                    </td>
                    <td style={{ padding: "0.75rem" }}>
                      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                        <button
                          onClick={() => handleResetPassword(user.id, user.email)}
                          className="btn btn-secondary"
                          style={{ padding: "0.5rem 1rem", fontSize: "0.875rem" }}
                          disabled={user.disabled}
                        >
                          <IconEdit />
                          Reset PIN
                        </button>
                        <button
                          onClick={() => handleToggleDisabled(user.id, user.email, user.disabled)}
                          disabled={user.id === currentUserId}
                          title={user.id === currentUserId ? "Sa ei saa enda keelustada" : ""}
                          className="btn btn-secondary"
                          style={{ 
                            padding: "0.5rem 1rem", 
                            fontSize: "0.875rem",
                            backgroundColor: user.disabled ? "var(--success-light)" : "var(--warning)",
                            color: user.disabled ? "#065f46" : "white",
                            opacity: user.id === currentUserId ? 0.6 : 1,
                            cursor: user.id === currentUserId ? "not-allowed" : "pointer",
                          }}
                        >
                          <IconBan />
                          {user.disabled ? "Luba" : "Keela"}
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id, user.email)}
                          disabled={user.id === currentUserId}
                          title={user.id === currentUserId ? "Sa ei saa enda kustutada" : ""}
                          className="btn btn-secondary"
                          style={{ 
                            padding: "0.5rem 1rem", 
                            fontSize: "0.875rem",
                            backgroundColor: "var(--danger-light)",
                            color: "#991b1b",
                            opacity: user.id === currentUserId ? 0.6 : 1,
                            cursor: user.id === currentUserId ? "not-allowed" : "pointer",
                          }}
                        >
                          <IconTrash />
                          Kustuta
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div style={{ marginTop: "1rem", color: "var(--text-light)", fontSize: "0.875rem" }}>
        Kokku: {filteredUsers.length} kasutajat
      </div>

      {/* Confirmation Dialog */}
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
