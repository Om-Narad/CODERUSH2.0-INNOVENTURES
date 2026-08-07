import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  INITIAL_ZONES,
  INITIAL_ROADS,
  INITIAL_ALERTS,
  INITIAL_STATS,
} from '../data/mockData';

const SentinelContext = createContext(null);
const API_BASE_URL = 'http://127.0.0.1:8000/api';

export function computeZonePriority(zone, roadsList) {
  const zoneRoads = zone.roadIds.map(id => roadsList.find(r => r.id === id)).filter(Boolean);
  const openRoads = zoneRoads.filter(r => r.status === 'open');
  const openCount = openRoads.length;
  const totalCount = zone.roadIds.length;

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
  const [roads, setRoads] = useState(INITIAL_ROADS);
  const [alerts, setAlerts] = useState(INITIAL_ALERTS);
  const [stats, setStats] = useState(INITIAL_STATS);
  const [selectedZoneId, setSelectedZoneId] = useState(null);
  const [rawZones, setRawZones] = useState(INITIAL_ZONES);
  const [apiOnline, setApiOnline] = useState(false);

  // Fetch initial state from FastAPI backend on mount
  useEffect(() => {
    async function fetchState() {
      try {
        const res = await fetch(`${API_BASE_URL}/state`);
        if (res.ok) {
          const data = await res.json();
          if (data.zones && data.roads) {
            setApiOnline(true);
            setRoads(data.roads);
            setAlerts(data.alerts);
            if (data.stats) {
              setStats({
                respondersDeployed: data.stats.responders_deployed ?? data.stats.respondersDeployed,
                respondersAvailable: data.stats.responders_available ?? data.stats.respondersAvailable,
                sheltersAtCapacity: data.stats.shelters_at_capacity ?? data.stats.sheltersAtCapacity,
                sheltersTotal: data.stats.shelters_total ?? data.stats.sheltersTotal,
              });
            }
            // Map backend zone fields
            const mappedZones = data.zones.map((z, idx) => ({
              id: z.id,
              name: z.name,
              peopleExposed: z.people_exposed ?? z.peopleExposed,
              status: z.status === 'assigned' ? 'Assigned' : 'Pending',
              recommendedResponders: Math.max(2, Math.round(z.people_exposed / 400)),
              assignedSquad: z.assigned_squad || `Squad Delta-${idx + 1} (Standby)`,
              assignedRespondersCount: z.status === 'assigned' ? 3 : 0,
              roadIds: INITIAL_ZONES[idx]?.roadIds || ['road-1', 'road-2'],
              nearestShelter: z.assigned_shelter || INITIAL_ZONES[idx]?.nearestShelter,
              basePriority: z.priority_score ?? INITIAL_ZONES[idx]?.basePriority,
              geometry: z.geometry?.coordinates ? z.geometry.coordinates[0].map(([lng, lat]) => [lat, lng]) : INITIAL_ZONES[idx].geometry,
            }));
            setRawZones(mappedZones);
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
          setRoads(data.roads);
          setAlerts(data.alerts);
          return;
        }
      } catch (e) {
        console.error('API toggle error, falling back', e);
      }
    }

    // Local fallback logic
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
    const affectedZones = rawZones.filter(z => z.roadIds.includes(roadId));

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
          setRoads(data.roads);
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
        setRoads(INITIAL_ROADS);
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

    // Local fallback
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
