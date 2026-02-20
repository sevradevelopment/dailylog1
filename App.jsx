import React, { useEffect, useMemo, useCallback, useRef, useState } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { supabase } from "./supabase";
import Login from "./components/Login";
import Sidebar from "./components/Sidebar";
import Today from "./components/Today";
import Admin from "./components/Admin";
import Users from "./components/Users";
import Locations from "./components/Locations";
import Stats from "./components/Stats";
import Fuel from "./components/Fuel";
import Notifications from "./components/Notifications";
import PWAInstallPrompt from "./components/PWAInstallPrompt";
import "./index.css";

// Session timeout: 1 hour
const SESSION_TIMEOUT_MS = 60 * 60 * 1000;

// Throttle activity updates (avoid state spam)
const ACTIVITY_THROTTLE_MS = 15_000;

function LoadingScreen() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
        <p className="mt-4 text-gray-600">Laen…</p>
      </div>
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState(null);
  const [userRole, setUserRole] = useState("worker");
  const [userName, setUserName] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Keep activity time in a ref to avoid re-render on every event
  const lastActivityRef = useRef(Date.now());
  const lastActivityWriteRef = useRef(0);

  // Prevent setState after unmount
  const mountedRef = useRef(true);

  // ---- Responsive: use matchMedia (more correct than resize+innerWidth) ----
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");

    const apply = () => setIsMobile(mq.matches);
    apply();

    // Safari < 14 fallback
    if (mq.addEventListener) mq.addEventListener("change", apply);
    else mq.addListener(apply);

    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", apply);
      else mq.removeListener(apply);
    };
  }, []);

  // ---- User profile loader ----
  const loadUserProfile = useCallback(async (userId) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("role, name, email")
        .eq("id", userId)
        .single();

      if (error) throw error;

      const role = data?.role || "worker";
      const name = data?.name || data?.email?.split("@")?.[0] || "Kasutaja";

      if (!mountedRef.current) return;
      setUserRole(role);
      setUserName(name);
    } catch (error) {
      console.error("Error loading profile:", error);
      if (!mountedRef.current) return;
      setUserRole("worker");
      setUserName("");
    }
  }, []);

  // ---- Logout ----
  const handleLogout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      if (!mountedRef.current) return;
      setSession(null);
      setUserRole("worker");
      setUserName("");
    }
  }, []);

  // ---- Activity tracker (throttled; no setState spam) ----
  useEffect(() => {
    const events = ["pointerdown", "keydown", "scroll", "touchstart", "click"];

    const markActivity = () => {
      const now = Date.now();
      lastActivityRef.current = now;

      // optional: if you want UI to react to activity later, throttle a state update
      if (now - lastActivityWriteRef.current >= ACTIVITY_THROTTLE_MS) {
        lastActivityWriteRef.current = now;
      }
    };

    events.forEach((ev) => document.addEventListener(ev, markActivity, { passive: true }));
    document.addEventListener("visibilitychange", markActivity);

    return () => {
      events.forEach((ev) => document.removeEventListener(ev, markActivity));
      document.removeEventListener("visibilitychange", markActivity);
    };
  }, []);

  // ---- Session timeout checker (single interval, stable, uses refs) ----
  useEffect(() => {
    if (!session) return;

    const tick = () => {
      const idleMs = Date.now() - lastActivityRef.current;
      if (idleMs >= SESSION_TIMEOUT_MS) handleLogout();
    };

    // check every 30s (more responsive), cheap because it's just math
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, [session, handleLogout]);

  // ---- Auth init + listener ----
  useEffect(() => {
    mountedRef.current = true;

    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const currentSession = data?.session || null;

        if (!mountedRef.current) return;

        setSession(currentSession);

        if (currentSession?.user?.id) {
          await loadUserProfile(currentSession.user.id);
        } else {
          setUserRole("worker");
          setUserName("");
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
      } finally {
        if (mountedRef.current) setIsLoading(false);
      }
    })();

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!mountedRef.current) return;

      setSession(newSession);

      if (newSession?.user?.id) {
        lastActivityRef.current = Date.now();
        await loadUserProfile(newSession.user.id);
      } else {
        setUserRole("worker");
        setUserName("");
      }
    });

    return () => {
      mountedRef.current = false;
      listener?.subscription?.unsubscribe?.();
    };
  }, [loadUserProfile]);

  // ---- UI ----
  if (isLoading) return <LoadingScreen />;
  if (!session) return <Login />;

  return (
    <div className="app-shell">
      <Sidebar
        userRole={userRole}
        onLogout={handleLogout}
        isMobile={isMobile}
        userName={userName}
      />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Today session={session} userRole={userRole} onLogout={handleLogout} />} />
          <Route path="/fuel" element={<Fuel session={session} userRole={userRole} />} />
          {userRole === "admin" && (
            <>
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/stats" element={<Stats />} />
              <Route path="/users" element={<Users />} />
              <Route path="/locations" element={<Locations />} />
            </>
          )}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
      <PWAInstallPrompt />
    </div>
  );
}
