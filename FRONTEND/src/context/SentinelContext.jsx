import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  INITIAL_ZONES,
  INITIAL_ROADS,
  INITIAL_ALERTS,
  INITIAL_STATS,
} from '../data/mockData';

const SentinelContext = createContext(null);
const API_BASE_URL = '/api';

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
  const [roads, setRoads] = useState(() => INITIAL_ROADS.map(normalizeRoad));
  const [alerts, setAlerts] = useState(INITIAL_ALERTS);
  const [stats, setStats] = useState(INITIAL_STATS);
  const [selectedZoneId, setSelectedZoneId] = useState(null);
  const [rawZones, setRawZones] = useState(() => INITIAL_ZONES.map((z, idx) => normalizeZone(z, idx)));
  const [apiOnline, setApiOnline] = useState(false);

  useEffect(() => {
    async function fetchState() {
      try {
        const res = await fetch(`${API_BASE_URL}/state`);
        if (res.ok) {
          const data = await res.json();
          if (data.zones && data.roads) {
            setApiOnline(true);
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
    }
    fetchState();
  }, []);

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
        const res = await fetch(`${API_BASE_URL}/roads/${roadId}/toggle`, { method: 'POST' });
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
        const res = await fetch(`${API_BASE_URL}/simulate`, { method: 'POST' });
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

    const road2 = roads.find(r => r.id === 'road-2');
    const road1 = roads.find(r => r.id === 'road-1');

    if (road2 && road2.status === 'open') {
      toggleRoadStatus('road-2');
    } else if (road1 && road1.status === 'open') {
      toggleRoadStatus('road-1');
    } else {
      const openRoad = roads.find(r => r.status === 'open');
      if (openRoad) {
        toggleRoadStatus(openRoad.id);
      } else {
        setRoads(INITIAL_ROADS.map(normalizeRoad));
        setAlerts(prev => [
          {
            id: `alert-${Date.now()}`,
            timestamp: getFormattedTime(),
            message: `${getFormattedTime()} — Demo Reset: All Brahmaputra evacuation routes reopened`,
            type: 'info',
          },
          ...prev,
        ]);
      }
    }
  };

  const assignResponders = async (zoneId) => {
    if (apiOnline) {
      try {
        const res = await fetch(`${API_BASE_URL}/zones/${zoneId}/assign`, { method: 'POST' });
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

    let newlyAssignedCount = 0;
    let zoneName = '';
    let isNowAssigned = false;

    setRawZones(prevZones =>
      prevZones.map(z => {
        if (z.id === zoneId) {
          zoneName = z.name;
          isNowAssigned = z.status !== 'Assigned';
          newlyAssignedCount = z.recommendedResponders;
          return {
            ...z,
            status: isNowAssigned ? 'Assigned' : 'Pending',
            assignedSquad: isNowAssigned
              ? `${z.assignedSquad.split(' ')[0]} ${z.assignedSquad.split(' ')[1]} (Deployed)`
              : `${z.assignedSquad.split(' ')[0]} ${z.assignedSquad.split(' ')[1]} (Standby)`,
            assignedRespondersCount: isNowAssigned ? z.recommendedResponders : 0,
          };
        }
        return z;
      })
    );

    setStats(prev => {
      const delta = isNowAssigned ? newlyAssignedCount : -newlyAssignedCount;
      return {
        ...prev,
        respondersDeployed: Math.max(0, prev.respondersDeployed + delta),
      };
    });

    const newAlert = {
      id: `alert-${Date.now()}`,
      timestamp: getFormattedTime(),
      message: isNowAssigned
        ? `${getFormattedTime()} — Responders Deployed: ${newlyAssignedCount} units dispatched to ${zoneName}`
        : `${getFormattedTime()} — Responders Unassigned from ${zoneName}`,
      type: isNowAssigned ? 'success' : 'info',
    };
    setAlerts(prev => [newAlert, ...prev]);
  };

  /**
   * predictFlood — Sends an image File to POST /api/predict
   * Returns: { label: "Flood"|"No Flood", confidence: number, flood_probability: number }
   * Throws an Error with a human-readable message on failure.
   */
  const predictFlood = async (imageFile) => {
    const formData = new FormData();
    formData.append('file', imageFile);
    const res = await fetch(`${API_BASE_URL}/predict`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      let detail = `Server error ${res.status}`;
      try { detail = (await res.json()).detail || detail; } catch {}
      throw new Error(detail);
    }
    return await res.json(); // { label, confidence, flood_probability }
  };

  return (
    <SentinelContext.Provider
      value={{
        currentView,
        setCurrentView,
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
