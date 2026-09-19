import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import {
  INITIAL_ZONES,
  INITIAL_ROADS,
  INITIAL_ALERTS,
  INITIAL_STATS,
} from '../data/mockData';

const SentinelContext = createContext(null);

const API_URL = (() => {
  const fromEnv = import.meta.env.VITE_API_URL;
  if (fromEnv) {
    const url = fromEnv.replace(/\/+$/, '');
    console.log('[SentinelPlan] API_URL resolved from VITE_API_URL:', url);
    return url;
  }
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return 'http://127.0.0.1:8000';
  }
  return 'https://coderush2-0-innoventures.onrender.com';
})();

export function normalizeRoad(r) {
  let coords = [];
  if (Array.isArray(r.geometry)) {
    coords = r.geometry;
  } else if (r.geometry?.coordinates) {
    coords = r.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
  }
  return {
    ...r,
    connectsZoneIds: r.connects_zone_ids || r.connectsZoneIds || [],
    geometry: coords,
  };
}

export function normalizeZone(z, idx) {
  const fallback = INITIAL_ZONES[idx] || {};
  let coords = [];

  if (Array.isArray(z.geometry)) {
    coords = z.geometry;
  } else if (z.geometry?.coordinates) {
    const rawRing = Array.isArray(z.geometry.coordinates[0]) ? z.geometry.coordinates[0] : z.geometry.coordinates;
    coords = rawRing.map(([lng, lat]) => [lat, lng]);
  } else if (fallback.geometry) {
    coords = fallback.geometry;
  }

  const people = z.people_exposed ?? z.peopleExposed ?? fallback.peopleExposed ?? 1000;
  const houses = z.houses_exposed ?? z.housesExposed ?? fallback.housesExposed ?? Math.round(people / 5);

  return {
    id: z.id,
    name: z.name,
    peopleExposed: people,
    housesExposed: houses,
    status: (z.status === 'assigned' || z.status === 'Assigned') ? 'Assigned' : 'Pending',
    recommendedResponders: Math.max(2, Math.round(people / 400)),
    assignedSquad: z.assigned_squad || z.assignedSquad || fallback.assignedSquad || `Squad Delta-${idx + 1} (Standby)`,
    assignedRespondersCount: (z.status === 'assigned' || z.status === 'Assigned') ? 3 : 0,
    roadIds: z.roadIds || fallback.roadIds || ['road-1', 'road-2'],
    nearestShelter: z.assigned_shelter || z.nearestShelter || fallback.nearestShelter || 'Central Relief Hub',
    basePriority: z.priority_score ?? z.basePriority ?? fallback.basePriority ?? 50,
    geometry: coords,
  };
}

export function computeZonePriority(zone, roadsList) {
  const zoneRoads = (zone.roadIds || []).map(id => roadsList.find(r => r.id === id)).filter(Boolean);
  const openRoads = zoneRoads.filter(r => r.status === 'open');
  const openCount = openRoads.length;
  const totalCount = (zone.roadIds || []).length;

  let calculatedScore = zone.basePriority || zone.priority_score || 40;
  const blockedCount = totalCount - openCount;
  if (blockedCount > 0) {
    calculatedScore += blockedCount * 14;
  }

  if (openCount === 0 && totalCount > 0) {
    calculatedScore = 98;
  } else if (openCount === 1 && totalCount > 1) {
    calculatedScore = Math.max(calculatedScore, 79);
  }

  const priority = Math.min(Math.max(calculatedScore, 15), 99);

  let severity = 'green';
  let severityColor = '#22c55e';
  if (priority >= 75) {
    severity = 'red';
    severityColor = '#ef4444';
  } else if (priority >= 50) {
    severity = 'amber';
    severityColor = '#f59e0b';
  }

  let rationale = `Normal evacuation route access (${openCount}/${totalCount} open). Stable.`;
  if (openCount === 0) {
    rationale = `CRITICAL ISOLATION: All ${totalCount} evacuation routes blocked! Emergency airlift required.`;
  } else if (openCount === 1) {
    const singleOpenRoad = openRoads[0]?.name || 'arterial route';
    rationale = `Evacuation bottleneck: single access via ${singleOpenRoad}. High flood threat.`;
  } else if (blockedCount > 0) {
    rationale = `${blockedCount} route(s) compromised. Rerouting traffic via active arteries.`;
  }

  return {
    ...zone,
    priority,
    severity,
    severityColor,
    roadsOpen: openCount,
    totalRoads: totalCount,
    rationale,
  };
}

export function SentinelProvider({ children }) {
  // Authentication State with Supabase
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [currentView, setCurrentView] = useState('login');

  // Helper to format Supabase user object into application user schema
  const formatUserObject = useCallback((sbUser) => {
    if (!sbUser) return null;
    const meta = sbUser.user_metadata || {};
    return {
      id: sbUser.id,
      email: sbUser.email,
      name: meta.full_name || sbUser.email.split('@')[0],
      role: meta.role || 'Nagpur Disaster Response Officer',
      org: meta.org_name || 'Nagpur Municipal Corporation (NMC)',
    };
  }, []);

  // Initialize Supabase Auth session & setup listener
  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (mounted) {
          if (session?.user) {
            const formatted = formatUserObject(session.user);
            setUser(formatted);
            setIsAuthenticated(true);
            setCurrentView((prev) => (prev === 'login' || prev === 'signup' ? 'dashboard' : prev));
          } else {
            setUser(null);
            setIsAuthenticated(false);
            setCurrentView('login');
          }
        }
      } catch (err) {
        console.error('[SentinelPlan] Supabase auth getSession error:', err);
      } finally {
        if (mounted) setAuthLoading(false);
      }
    }

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        if (session?.user) {
          const formatted = formatUserObject(session.user);
          setUser(formatted);
          setIsAuthenticated(true);
          setCurrentView((prev) => (prev === 'login' || prev === 'signup' ? 'dashboard' : prev));
        } else {
          setUser(null);
          setIsAuthenticated(false);
          setCurrentView('login');
        }
        setAuthLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, [formatUserObject]);

  // Supabase Login Handler
  const loginWithSupabase = useCallback(async (email, password) => {
    try {
      const cleanEmail = (email || '').trim().toLowerCase();
      const cleanPassword = (password || '').trim();

      if (!cleanEmail || !cleanPassword) {
        return { success: false, error: 'Please provide both your official email and password.' };
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPassword,
      });

      if (error) {
        console.error('[SentinelPlan Auth] signInWithPassword error:', error);
        let msg = error.message || 'Authentication failed';
        
        if (msg.includes('Invalid login credentials') || msg.includes('invalid_credentials')) {
          msg = 'Invalid email address or password. Please check your credentials.';
        } else if (msg.includes('Email not confirmed')) {
          msg = 'Your email address has not been confirmed yet. Please check your inbox for the confirmation email.';
        } else if (msg.includes('Invalid path') || msg.includes('not found') || error.status === 404) {
          msg = 'Supabase API path error. Please ensure VITE_SUPABASE_URL points to project root (e.g. https://xyz.supabase.co).';
        }
        
        return { success: false, error: msg };
      }

      if (!data?.user) {
        return { success: false, error: 'Login attempt returned empty session data.' };
      }

      const formatted = formatUserObject(data.user);
      setUser(formatted);
      setIsAuthenticated(true);
      setCurrentView('dashboard');
      return { success: true, user: formatted };
    } catch (err) {
      console.error('[SentinelPlan Auth] Login unexpected error:', err);
      return { success: false, error: err.message || 'An unexpected error occurred during login.' };
    }
  }, [formatUserObject]);

  // Supabase Signup Handler
  const signupWithSupabase = useCallback(async ({ email, password, fullName, orgName, role }) => {
    try {
      const cleanEmail = (email || '').trim().toLowerCase();
      const cleanPassword = (password || '').trim();

      // Dynamic redirect URL for confirmation email callback (works on localhost & live Vercel domain)
      const redirectUrl = typeof window !== 'undefined' ? window.location.origin : undefined;

      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: cleanPassword,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: (fullName || '').trim(),
            org_name: (orgName || '').trim(),
            role: role || 'Nagpur Disaster Officer',
          }
        }
      });

      if (error) {
        console.error('[SentinelPlan Auth] signUp error:', error);
        let msg = error.message || 'Registration failed';
        
        if (msg.includes('User already registered') || msg.includes('already exists')) {
          msg = 'An officer account with this email address already exists. Please sign in instead.';
        } else if (msg.includes('Password should be at least')) {
          msg = 'Password must be at least 6 characters long.';
        } else if (msg.includes('invalid') && msg.includes('email')) {
          msg = 'Please enter a valid official email address.';
        } else if (msg.includes('Invalid path') || msg.includes('not found') || error.status === 404) {
          msg = 'Supabase API path error. Please ensure VITE_SUPABASE_URL points to project root.';
        }
        
        return { success: false, error: msg };
      }

      // Record officer details into database officers table if present
      if (data?.user) {
        try {
          await supabase.from('officers').upsert([{
            email: cleanEmail,
            full_name: (fullName || '').trim(),
            org_name: (orgName || '').trim(),
            role: role || 'Nagpur Disaster Officer',
          }], { onConflict: 'email' });
        } catch (insertErr) {
          console.warn('[SentinelPlan] Notice on officers table insert:', insertErr.message);
        }
      }

      const requiresConfirmation = !data.session && !!data.user;
      if (data.session && data.user) {
        const formatted = formatUserObject(data.user);
        setUser(formatted);
        setIsAuthenticated(true);
        setCurrentView('dashboard');
        return { success: true, user: formatted, requiresConfirmation: false };
      }

      return { success: true, user: data.user, requiresConfirmation: true };
    } catch (err) {
      console.error('[SentinelPlan Auth] Signup unexpected error:', err);
      return { success: false, error: err.message || 'An unexpected error occurred during account creation' };
    }
  }, [formatUserObject]);

  // Supabase Logout Handler
  const logoutWithSupabase = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('[SentinelPlan] Supabase signOut error:', err.message);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      setCurrentView('login');
    }
  }, []);

  // Default Region: Exclusive to Nagpur (Maharashtra, India)
  const [currentRegionId, setCurrentRegionId] = useState('nagpur');
  const [currentRegionMeta, setCurrentRegionMeta] = useState({
    id: 'nagpur',
    name: 'Nagpur Flood Command Center',
    city: 'Nagpur',
    state: 'Maharashtra',
    country: 'India',
    center: [21.1458, 79.0882],
    zoom: 12,
    hazard_level: 'Critical',
    description: 'Real-time Nag River & Pili River flood monitoring across Nagpur Municipal Corporation (NMC) sectors.'
  });

  const [availableRegions, setAvailableRegions] = useState([
    {
      id: 'nagpur',
      name: 'Nagpur Flood Command Center',
      city: 'Nagpur',
      state: 'Maharashtra',
      country: 'India',
      hazard_level: 'Critical',
    }
  ]);

  const [roads, setRoads] = useState(() => INITIAL_ROADS.map(normalizeRoad));
  const [alerts, setAlerts] = useState(INITIAL_ALERTS);
  const [stats, setStats] = useState(INITIAL_STATS);
  const [selectedZoneId, setSelectedZoneId] = useState(null);
  const [rawZones, setRawZones] = useState(() => INITIAL_ZONES.map((z, idx) => normalizeZone(z, idx)));
  const [apiOnline, setApiOnline] = useState(false);

  // SOS Alert System State
  const [sosAlerts, setSosAlerts] = useState([]);
  const [sosNotification, setSosNotification] = useState(null);

  // Protect view switching
  const setProtectedView = useCallback((view) => {
    if (!isAuthenticated && view !== 'login' && view !== 'signup') {
      setCurrentView('login');
    } else {
      setCurrentView(view);
    }
  }, [isAuthenticated]);

  // Fetch state for region (falls back cleanly to local Nagpur data if backend offline)
  const fetchStateForRegion = useCallback(async (regionId) => {
    const url = `${API_URL}/api/state?region=${encodeURIComponent(regionId)}`;
    try {
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setApiOnline(true);
        if (data.region) {
          setCurrentRegionMeta({
            ...data.region,
            name: 'Nagpur Flood Command Center',
            center: [21.1458, 79.0882],
          });
        }
        if (data.zones && data.roads) {
          setRoads(data.roads.map(normalizeRoad));
          setAlerts(data.alerts || INITIAL_ALERTS);
          if (data.stats) {
            setStats({
              respondersDeployed: data.stats.responders_deployed ?? data.stats.respondersDeployed ?? INITIAL_STATS.respondersDeployed,
              respondersAvailable: data.stats.responders_available ?? data.stats.respondersAvailable ?? INITIAL_STATS.respondersAvailable,
              sheltersAtCapacity: data.stats.shelters_at_capacity ?? data.stats.sheltersAtCapacity ?? INITIAL_STATS.sheltersAtCapacity,
              sheltersTotal: data.stats.shelters_total ?? data.stats.sheltersTotal ?? INITIAL_STATS.sheltersTotal,
              housesExposed: INITIAL_STATS.housesExposed,
            });
          }
          setRawZones(data.zones.map((z, idx) => normalizeZone(z, idx)));
        }
      } else {
        setApiOnline(false);
      }
    } catch {
      setApiOnline(false);
    }
  }, []);

  useEffect(() => {
    fetchStateForRegion(currentRegionId);
  }, [currentRegionId, fetchStateForRegion]);

  const switchRegion = (regionId) => {
    setCurrentRegionId(regionId);
  };

  const zones = useMemo(() => {
    return rawZones
      .map(z => computeZonePriority(z, roads))
      .sort((a, b) => b.priority - a.priority);
  }, [rawZones, roads]);

  const getFormattedTime = () => {
    const now = new Date();
    return now.toTimeString().split(' ')[0];
  };

  const toggleRoadStatus = async (roadId) => {
    if (apiOnline) {
      try {
        const res = await fetch(`${API_URL}/api/roads/${roadId}/toggle?region=${encodeURIComponent(currentRegionId)}`, { method: 'POST' });
        if (res.ok) {
          const data = await res.json();
          setRoads(data.roads.map(normalizeRoad));
          setAlerts(data.alerts || []);
          return;
        }
      } catch (e) {
        console.error('[SentinelPlan] toggle failed, local fallback applied:', e.message);
      }
    }

    let toggledRoadName = '';
    let newStatus = 'open';

    const updatedRoads = roads.map(r => {
      if (r.id === roadId) {
        newStatus = r.status === 'open' ? 'blocked' : 'open';
        toggledRoadName = r.name;
        return { ...r, status: newStatus };
      }
      return r;
    });

    setRoads(updatedRoads);
    const affectedZones = rawZones.filter(z => (z.roadIds || []).includes(roadId));

    const newAlert = {
      id: `alert-${Date.now()}`,
      timestamp: getFormattedTime(),
      message: `${getFormattedTime()} — Road ${toggledRoadName} ${newStatus}, ${affectedZones.length} Nagpur zones re-prioritized`,
      type: newStatus === 'blocked' ? 'warning' : 'info',
    };
    setAlerts(prev => [newAlert, ...prev]);
  };

  const simulateRoadBlock = async () => {
    if (apiOnline) {
      try {
        const res = await fetch(`${API_URL}/api/simulate?region=${encodeURIComponent(currentRegionId)}`, { method: 'POST' });
        if (res.ok) {
          const data = await res.json();
          setRoads(data.roads.map(normalizeRoad));
          setAlerts(data.alerts || []);
          return;
        }
      } catch (e) {
        console.error('[SentinelPlan] simulate failed, local fallback applied:', e.message);
      }
    }

    const firstRoad = roads[0];
    if (firstRoad) {
      toggleRoadStatus(firstRoad.id);
    }
  };

  const assignResponders = async (zoneId) => {
    if (apiOnline) {
      try {
        const res = await fetch(`${API_URL}/api/zones/${zoneId}/assign?region=${encodeURIComponent(currentRegionId)}`, { method: 'POST' });
        if (res.ok) {
          const data = await res.json();
          setAlerts(data.alerts || []);
          if (data.stats) {
            setStats({
              respondersDeployed: data.stats.responders_deployed ?? data.stats.respondersDeployed,
              respondersAvailable: data.stats.responders_available ?? data.stats.respondersAvailable,
              sheltersAtCapacity: data.stats.shelters_at_capacity ?? data.stats.sheltersAtCapacity,
              sheltersTotal: data.stats.shelters_total ?? data.stats.sheltersTotal,
            });
          }
          setRawZones(prev =>
            prev.map(z => {
              if (z.id === zoneId) {
                const bz = data.zones.find(x => x.id === zoneId);
                return {
                  ...z,
                  status: 'Assigned',
                  assignedSquad: bz?.assigned_squad || z.assignedSquad,
                };
              }
              return z;
            })
          );
          return;
        }
      } catch (e) {
        console.error('[SentinelPlan] assign failed, local fallback applied:', e.message);
      }
    }

    setRawZones(prevZones =>
      prevZones.map(z => {
        if (z.id === zoneId) {
          return {
            ...z,
            status: z.status === 'Assigned' ? 'Pending' : 'Assigned',
          };
        }
        return z;
      })
    );
  };

  const predictFlood = async (imageFile) => {
    const formData = new FormData();
    formData.append('file', imageFile);
    const url = `${API_URL}/api/predict?region=${encodeURIComponent(currentRegionId)}`;
    const res = await fetch(url, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      let detail = `Server error ${res.status}`;
      try { detail = (await res.json()).detail || detail; } catch { }
      throw new Error(detail);
    }
    const result = await res.json();
    fetchStateForRegion(currentRegionId);
    return result;
  };

  const sendSosAlert = useCallback((zoneId, currentZones) => {
    const zone = (currentZones || []).find(z => z.id === zoneId);
    if (!zone) return;

    const timestamp = new Date().toLocaleTimeString('en-IN', { hour12: false });
    const sosEntry = {
      id: `sos-${Date.now()}-${zoneId}`,
      zoneId,
      zoneName: zone.name,
      peopleExposed: zone.peopleExposed,
      priority: zone.priority,
      severity: zone.severity,
      severityColor: zone.severityColor,
      timestamp,
      message: `SOS Alert dispatched to ${zone.peopleExposed.toLocaleString()} residents in ${zone.name}, Nagpur`,
    };

    setSosAlerts(prev => [sosEntry, ...prev]);

    setSosNotification({
      id: sosEntry.id,
      zoneName: zone.name,
      peopleExposed: zone.peopleExposed,
    });
    setTimeout(() => {
      setSosNotification(null);
    }, 4000);

    const systemAlert = {
      id: `alert-sos-${Date.now()}`,
      timestamp,
      message: `🚨 SOS ALERT SENT — ${zone.name} (Priority ${zone.priority}): Emergency evacuation notice sent to ${zone.peopleExposed.toLocaleString()} Nagpur residents.`,
      type: 'critical',
    };
    setAlerts(prev => [systemAlert, ...prev]);
  }, []);

  const sendMassSos = useCallback((currentZones) => {
    const criticalZones = (currentZones || []).filter(z => z.severity === 'red');
    if (criticalZones.length === 0) return;

    const timestamp = new Date().toLocaleTimeString('en-IN', { hour12: false });
    const newSosEntries = criticalZones.map(zone => ({
      id: `sos-mass-${Date.now()}-${zone.id}`,
      zoneId: zone.id,
      zoneName: zone.name,
      peopleExposed: zone.peopleExposed,
      priority: zone.priority,
      severity: zone.severity,
      severityColor: zone.severityColor,
      timestamp,
      message: `MASS SOS: Alert dispatched to ${zone.peopleExposed.toLocaleString()} residents in ${zone.name}`,
      isMassAlert: true,
    }));

    setSosAlerts(prev => [...newSosEntries, ...prev]);

    const totalPeople = criticalZones.reduce((sum, z) => sum + z.peopleExposed, 0);
    setSosNotification({
      id: `mass-${Date.now()}`,
      zoneName: `ALL ${criticalZones.length} Critical Zones (Nagpur)`,
      peopleExposed: totalPeople,
      isMass: true,
    });
    setTimeout(() => setSosNotification(null), 5000);

    const systemAlert = {
      id: `alert-mass-sos-${Date.now()}`,
      timestamp,
      message: `🚨 MASS SOS DISPATCHED — ${criticalZones.length} critical zones, ${totalPeople.toLocaleString()} residents alerted across Nagpur sectors.`,
      type: 'critical',
    };
    setAlerts(prev => [systemAlert, ...prev]);
  }, []);

  const dismissSosNotification = useCallback(() => {
    setSosNotification(null);
  }, []);

  return (
    <SentinelContext.Provider
      value={{
        user,
        isAuthenticated,
        authLoading,
        login: loginWithSupabase,
        logout: logoutWithSupabase,
        loginWithSupabase,
        signupWithSupabase,
        logoutWithSupabase,
        currentView,
        setCurrentView: setProtectedView,
        currentRegionId,
        currentRegionMeta,
        availableRegions,
        switchRegion,
        zones,
        roads,
        alerts,
        stats,
        selectedZoneId,
        setSelectedZoneId,
        toggleRoadStatus,
        simulateRoadBlock,
        assignResponders,
        predictFlood,
        apiOnline,
        sosAlerts,
        sosNotification,
        sendSosAlert,
        sendMassSos,
        dismissSosNotification,
      }}
    >
      {children}
    </SentinelContext.Provider>
  );
}

export function useSentinel() {
  const context = useContext(SentinelContext);
  if (!context) {
    throw new Error('useSentinel must be used within a SentinelProvider');
  }
  return context;
}
