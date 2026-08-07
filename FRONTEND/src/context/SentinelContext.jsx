import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  INITIAL_ZONES,
  INITIAL_ROADS,
  INITIAL_ALERTS,
  INITIAL_STATS,
} from '../data/mockData';

const SentinelContext = createContext(null);
const API_BASE_URL = 'https://coderush-2-0-innoventures-f9d6.vercel.app/api';

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

  return {
    id: z.id,
    name: z.name,
    peopleExposed: z.people_exposed ?? z.peopleExposed ?? fallback.peopleExposed ?? 1000,
    status: (z.status === 'assigned' || z.status === 'Assigned') ? 'Assigned' : 'Pending',
    recommendedResponders: Math.max(2, Math.round((z.people_exposed ?? z.peopleExposed ?? fallback.peopleExposed ?? 1000) / 400)),
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
  const [currentView, setCurrentView] = useState('dashboard');
  const [currentRegionId, setCurrentRegionId] = useState('assam');
  const [currentRegionMeta, setCurrentRegionMeta] = useState({
    id: 'assam',
    name: 'Guwahati & Brahmaputra Basin',
    country: 'India',
    center: [26.185, 91.745],
    zoom: 12,
    hazard_level: 'Critical'
  });
  const [availableRegions, setAvailableRegions] = useState([]);
  const [roads, setRoads] = useState(() => INITIAL_ROADS.map(normalizeRoad));
  const [alerts, setAlerts] = useState(INITIAL_ALERTS);
  const [stats, setStats] = useState(INITIAL_STATS);
  const [selectedZoneId, setSelectedZoneId] = useState(null);
  const [rawZones, setRawZones] = useState(() => INITIAL_ZONES.map((z, idx) => normalizeZone(z, idx)));
  const [apiOnline, setApiOnline] = useState(false);
  const [gdacsLiveFeed, setGdacsLiveFeed] = useState([]);

  // Fetch available regions at startup
  useEffect(() => {
    async function loadRegions() {
      try {
        const res = await fetch(`${API_BASE_URL}/regions`);
        if (res.ok) {
          const list = await res.json();
          setAvailableRegions(list);
        }
      } catch (e) {
        console.warn('Could not fetch regions list from API', e);
      }
    }
    loadRegions();
  }, []);

  // Fetch state for active region
  const fetchStateForRegion = useCallback(async (regionId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/state?region=${regionId}`);
      if (res.ok) {
        const data = await res.json();
        setApiOnline(true);
        if (data.region) setCurrentRegionMeta(data.region);
        if (data.zones && data.roads) {
          setRoads(data.roads.map(normalizeRoad));
          setAlerts(data.alerts);
          if (data.stats) {
            setStats({
              respondersDeployed: data.stats.responders_deployed ?? data.stats.respondersDeployed,
              respondersAvailable: data.stats.responders_available ?? data.stats.respondersAvailable,
              sheltersAtCapacity: data.stats.shelters_at_capacity ?? data.stats.sheltersAtCapacity,
              sheltersTotal: data.stats.shelters_total ?? data.stats.sheltersTotal,
            });
          }
          setRawZones(data.zones.map((z, idx) => normalizeZone(z, idx)));
        }
      }
    } catch (err) {
      console.warn('Backend API offline, operating in client fallback mode.', err);
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
        const res = await fetch(`${API_BASE_URL}/roads/${roadId}/toggle?region=${currentRegionId}`, { method: 'POST' });
        if (res.ok) {
          const data = await res.json();
          setRoads(data.roads.map(normalizeRoad));
          setAlerts(data.alerts);
          return;
        }
      } catch (e) {
        console.error('API toggle error, falling back', e);
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
      message: `${getFormattedTime()} — Road ${toggledRoadName} ${newStatus}, ${affectedZones.length} zones re-prioritized`,
      type: newStatus === 'blocked' ? 'warning' : 'info',
    };
    setAlerts(prev => [newAlert, ...prev]);
  };

  const simulateRoadBlock = async () => {
    if (apiOnline) {
      try {
        const res = await fetch(`${API_BASE_URL}/simulate?region=${currentRegionId}`, { method: 'POST' });
        if (res.ok) {
          const data = await res.json();
          setRoads(data.roads.map(normalizeRoad));
          setAlerts(data.alerts);
          return;
        }
      } catch (e) {
        console.error('API simulate error, falling back', e);
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
        const res = await fetch(`${API_BASE_URL}/zones/${zoneId}/assign?region=${currentRegionId}`, { method: 'POST' });
        if (res.ok) {
          const data = await res.json();
          setAlerts(data.alerts);
          if (data.stats) {
            setStats({
              respondersDeployed: data.stats.responders_deployed,
              respondersAvailable: data.stats.responders_available,
              sheltersAtCapacity: data.stats.shelters_at_capacity,
              sheltersTotal: data.stats.shelters_total,
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
        console.error('API assign error, falling back', e);
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
    const res = await fetch(`${API_BASE_URL}/predict?region=${currentRegionId}`, {
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

  return (
    <SentinelContext.Provider
      value={{
        currentView,
        setCurrentView,
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
