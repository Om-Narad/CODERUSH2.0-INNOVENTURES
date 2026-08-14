// Mock Data for SentinelPlan - Nagpur Flood Response, Maharashtra, India

export const DEMO_SCENARIO_SUBTITLE = "Demo scenario — Nagpur Nag & Pili River flood event, Maharashtra • August 2026";

export const INITIAL_STATS = {
  activeZonesCount: 4,
  peopleExposed: 8350,
  housesExposed: 1670,
  respondersDeployed: 14,
  respondersAvailable: 22,
  sheltersAtCapacity: 2,
  sheltersTotal: 5,
};

export const INITIAL_ROADS = [
  {
    id: 'road-1',
    name: 'Wardha Road Highway Corridor (NH-44)',
    status: 'open',
    type: 'Primary Highway',
    connectsZoneIds: ['zone-1', 'zone-4'],
    geometry: [
      [21.090, 79.055],
      [21.115, 79.060],
      [21.135, 79.065],
      [21.150, 79.075],
    ],
  },
  {
    id: 'road-2',
    name: 'Ambazari Lake Spillway Expressway',
    status: 'open',
    type: 'Bridge Arterial',
    connectsZoneIds: ['zone-1', 'zone-2'],
    geometry: [
      [21.130, 79.045],
      [21.140, 79.060],
      [21.148, 79.075],
    ],
  },
  {
    id: 'road-3',
    name: 'Nag River Urban Bypass Corridor',
    status: 'open',
    type: 'Secondary Arterial',
    connectsZoneIds: ['zone-2'],
    geometry: [
      [21.148, 79.075],
      [21.155, 79.090],
      [21.165, 79.105],
    ],
  },
  {
    id: 'road-4',
    name: 'Sitabuldi Central Metro Arterial',
    status: 'open',
    type: 'Urban Connector',
    connectsZoneIds: ['zone-2'],
    geometry: [
      [21.135, 79.065],
      [21.145, 79.080],
      [21.155, 79.090],
    ],
  },
  {
    id: 'road-5',
    name: 'Kamptee Highway Emergency Pass (NH-53)',
    status: 'open',
    type: 'Emergency Route',
    connectsZoneIds: ['zone-3'],
    geometry: [
      [21.165, 79.105],
      [21.180, 79.115],
      [21.195, 79.130],
    ],
  },
  {
    id: 'road-6',
    name: 'Hingna Ring Road Feeder',
    status: 'open',
    type: 'Feeder Road',
    connectsZoneIds: ['zone-1', 'zone-4'],
    geometry: [
      [21.110, 79.025],
      [21.125, 79.040],
      [21.135, 79.055],
    ],
  },
  {
    id: 'road-7',
    name: 'Gorewada Dam Bypass Pass',
    status: 'open',
    type: 'Lake Pass',
    connectsZoneIds: ['zone-4'],
    geometry: [
      [21.170, 79.030],
      [21.185, 79.045],
      [21.195, 79.055],
    ],
  },
];

// Nagpur Zones centered around roughly 21.1458, 79.0882
export const INITIAL_ZONES = [
  {
    id: 'zone-1',
    name: 'Ambazari & Subhash Nagar Lowlands',
    peopleExposed: 3200,
    housesExposed: 640,
    status: 'Pending',
    recommendedResponders: 6,
    assignedSquad: 'Nagpur NDRF Unit 1 (Standby)',
    assignedRespondersCount: 0,
    roadIds: ['road-1', 'road-2', 'road-6'],
    nearestShelter: 'Ambazari Relief Center (Cap: 500/600)',
    basePriority: 85, // Red / Critical (>=75)
    geometry: [
      [21.125, 79.035],
      [21.142, 79.042],
      [21.138, 79.060],
      [21.120, 79.052],
    ],
  },
  {
    id: 'zone-2',
    name: 'Nag River Central Corridor (Sitabuldi)',
    peopleExposed: 2400,
    housesExposed: 480,
    status: 'Pending',
    recommendedResponders: 4,
    assignedSquad: 'Nagpur Fire Squad 2 (Standby)',
    assignedRespondersCount: 0,
    roadIds: ['road-2', 'road-3', 'road-4'],
    nearestShelter: 'Mankapur Sports Complex (Cap: 1,500/1,500 - FULL)',
    basePriority: 68, // Amber / Warning (50-74)
    geometry: [
      [21.145, 79.075],
      [21.162, 79.082],
      [21.155, 79.100],
      [21.138, 79.092],
    ],
  },
  {
    id: 'zone-3',
    name: 'Pili River North Basin (Kalamna)',
    peopleExposed: 1800,
    housesExposed: 360,
    status: 'Pending',
    recommendedResponders: 3,
    assignedSquad: 'Quick Response Team Alpha (Standby)',
    assignedRespondersCount: 0,
    roadIds: ['road-3', 'road-5'],
    nearestShelter: 'Resimbagh Civic Center (Cap: 800/800 - FULL)',
    basePriority: 45, // Green / Stable (<50)
    geometry: [
      [21.175, 79.100],
      [21.192, 79.108],
      [21.188, 79.125],
      [21.168, 79.118],
    ],
  },
  {
    id: 'zone-4',
    name: 'Gorewada Catchment & Wardha Road Link',
    peopleExposed: 950,
    housesExposed: 190,
    status: 'Pending',
    recommendedResponders: 2,
    assignedSquad: 'Civil Defense Rescue Squad 4 (Standby)',
    assignedRespondersCount: 0,
    roadIds: ['road-1', 'road-6', 'road-7'],
    nearestShelter: 'Sitabuldi Community Shelter (Cap: 350/450)',
    basePriority: 32, // Green / Stable (<50)
    geometry: [
      [21.100, 79.040],
      [21.118, 79.048],
      [21.112, 79.065],
      [21.095, 79.058],
    ],
  },
];

export const INITIAL_ALERTS = [
  {
    id: 'alert-1',
    timestamp: '14:28:10',
    message: 'System Initialized — Nagpur Municipal Corporation (NMC) Flood Telemetry active.',
    type: 'info',
  },
  {
    id: 'alert-2',
    timestamp: '14:30:45',
    message: 'Nag River Level Alert — Sitabuldi gauge station recorded +1.6m surge above danger level.',
    type: 'warning',
  },
  {
    id: 'alert-3',
    timestamp: '14:32:00',
    message: 'CRITICAL WARNING — Ambazari & Subhash Nagar Lowlands flood priority elevated to 85 (RED).',
    type: 'critical',
  },
];

export const DENSITY_HEATMAP_POINTS = [
  { lat: 21.130, lng: 79.045, intensity: 0.95, label: 'Ambazari Spillway Sector' },
  { lat: 21.150, lng: 79.080, intensity: 0.85, label: 'Sitabuldi Nag River Channel' },
  { lat: 21.180, lng: 79.110, intensity: 0.70, label: 'Kalamna Pili River Basin' },
  { lat: 21.105, lng: 79.050, intensity: 0.60, label: 'Wardha Road Corridor' },
];
