import { createClient } from "@supabase/supabase-js";

// Validate environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Please check your .env file."
  );
}

// Create Supabase client with options
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  db: {
    schema: "public",
  },
  global: {
    headers: {
      "x-application-name": "toopaeviku-app",
    },
  },
});

// Helper functions for common operations
export const auth = {
  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  getSession: async () => {
    const { data, error } = await supabase.auth.getSession();
    return { data, error };
  },

  getUser: async () => {
    const { data, error } = await supabase.auth.getUser();
    return { data, error };
  },
};

// Database helpers
export const db = {
  // Profiles
  getProfile: async (userId) => {
    return await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
  },

  updateProfile: async (userId, updates) => {
    return await supabase
      .from("profiles")
      .update(updates)
      .eq("id", userId);
  },

  // Daily logs
  getDailyLogs: async (filters = {}) => {
    let query = supabase.from("daily_logs").select("*");

    if (filters.userId) query = query.eq("user_id", filters.userId);
    if (filters.dateFrom) query = query.gte("work_date", filters.dateFrom);
    if (filters.dateTo) query = query.lte("work_date", filters.dateTo);
    if (filters.siteId) query = query.eq("site_id", filters.siteId);

    return await query.order("work_date", { ascending: false });
  },

  upsertDailyLog: async (log) => {
    return await supabase
      .from("daily_logs")
      .upsert(log, { onConflict: "user_id,work_date" });
  },

  // Sites
  getSites: async () => {
    return await supabase
      .from("sites")
      .select("*")
      .order("name");
  },

  // Locations
  getLocations: async () => {
    return await supabase
      .from("locations")
      .select("*")
      .order("name");
  },

  // Fuel logs
  getFuelLogs: async (userId, isAdmin = false) => {
    let query = supabase
      .from("fuel_logs")
      .select("*, profiles(name, email)")
      .order("created_at", { ascending: false });

    if (!isAdmin) {
      query = query.eq("user_id", userId);
    }

    return await query.limit(isAdmin ? 50 : 20);
  },

  insertFuelLog: async (log) => {
    return await supabase.from("fuel_logs").insert(log);
  },
};

export default supabase;
