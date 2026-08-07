// Mock Data for SentinelPlan - Brahmaputra Flood Response, Assam

export const DEMO_SCENARIO_SUBTITLE = "Demo scenario — Brahmaputra flood event, Assam • August 2026";

export const INITIAL_STATS = {
  activeZonesCount: 4,
  peopleExposed: 5800,
  respondersDeployed: 12,
  respondersAvailable: 20,
  sheltersAtCapacity: 2,
  sheltersTotal: 5,
};

export const INITIAL_ROADS = [
  {
    id: 'road-1',
    name: 'NH-27 Brahmaputra Arterial Highway',
    status: 'open',
    type: 'Primary Highway',
    connectsZoneIds: ['zone-1', 'zone-3'],
    geometry: [
      [26.155, 73.848], // Note: adjusted to Assam coordinates
      [26.165, 91.745],
      [26.185, 91.742],
      [26.202, 91.738],
    ],
  },
  {
    id: 'road-2',
    name: 'Saraighat River Bridge Expressway',
    status: 'open',
    type: 'Bridge Arterial',
    connectsZoneIds: ['zone-1', 'zone-2'],
    geometry: [
      [26.202, 91.738],
      [26.198, 91.752],
      [26.195, 91.765],
    ],
  },
  {
    id: 'road-3',
    name: 'East Guwahati Bypass Corridor',
    status: 'open',
    type: 'Secondary Arterial',
    connectsZoneIds: ['zone-2'],
    geometry: [
      [26.195, 91.765],
      [26.182, 91.778],
      [26.170, 91.785],
    ],
  },
  {
    id: 'road-4',
    name: 'Metro Central Link',
    status: 'open',
    type: 'Urban Connector',
    connectsZoneIds: ['zone-2'],
    geometry: [
      [26.165, 91.745],
      [26.175, 91.758],
      [26.195, 91.765],
    ],
  },
  {
    id: 'road-5',
    name: 'South Bank Emergency Pass',
    status: 'open',
    type: 'Emergency Route',
    connectsZoneIds: ['zone-3'],
    geometry: [
      [26.148, 91.740],
      [26.158, 91.742],
      [26.165, 91.745],
    ],
  },
  {
    id: 'road-6',
    name: 'West Guwahati Feeder',
    status: 'open',
    type: 'Feeder Road',
    connectsZoneIds: ['zone-3', 'zone-4'],
    geometry: [
      [26.165, 91.745],
      [26.185, 91.728],
      [26.210, 91.715],
    ],
  },
  {
    id: 'road-7',
    name: 'Kaziranga Reserve Pass',
    status: 'open',
    type: 'Mountain Pass',
    connectsZoneIds: ['zone-4'],
    geometry: [
      [26.210, 91.715],
      [26.225, 91.705],
      [26.238, 91.698],
    ],
  },
];

// Fix geometry coordinates to tight Assam Brahmaputra basin region
// Center roughly 26.185, 91.740
export const INITIAL_ZONES = [
  {
    id: 'zone-1',
    name: 'Guwahati North Lowlands (Sector 7)',
    peopleExposed: 2400,
    status: 'Pending',
    recommendedResponders: 6,
    assignedSquad: 'Squad Delta-1 (Standby)',
    assignedRespondersCount: 0,
    roadIds: ['road-1', 'road-2'],
    nearestShelter: 'Saraighat Relief Center (Cap: 450/500)',
    basePriority: 84, // Genuinely Red / Critical (>=75)
    geometry: [
      [26.195, 91.725],
      [26.212, 91.732],
      [26.208, 91.750],
      [26.190, 91.745],
    ],
  },
  {
    id: 'zone-2',
    name: 'Brahmaputra River Basin East',
    peopleExposed: 1600,
    status: 'Pending',
    recommendedResponders: 4,
    assignedSquad: 'Squad Bravo-3 (Standby)',
    assignedRespondersCount: 0,
    roadIds: ['road-2', 'road-3', 'road-4'],
    nearestShelter: 'St. Jude High School (Cap: 800/800 - FULL)',
    basePriority: 62, // Amber / Warning (50-74)
    geometry: [
      [26.182, 91.752],
      [26.202, 91.758],
      [26.192, 91.782],
      [26.172, 91.775],
    ],
  },
  {
    id: 'zone-3',
    name: 'Kamrup Central Transit Hub',
    peopleExposed: 1100,
    status: 'Pending',
    recommendedResponders: 3,
    assignedSquad: 'Alpha Tactical Unit (Standby)',
    assignedRespondersCount: 0,
    roadIds: ['road-1', 'road-5', 'road-6'],
    nearestShelter: 'Guwahati Stadium Complex (Cap: 1,100/1,500)',
    basePriority: 41, // Green / Stable (<50)
    geometry: [
      [26.155, 91.730],
      [26.175, 91.735],
      [26.170, 91.752],
      [26.150, 91.745],
    ],
  },
  {
    id: 'zone-4',
    name: 'Kaziranga Foothills Reserve',
    peopleExposed: 700,
    status: 'Pending',
    recommendedResponders: 2,
    assignedSquad: 'Eco Rescue Squad-4 (Standby)',
    assignedRespondersCount: 0,
    roadIds: ['road-6', 'road-7'],
    nearestShelter: 'Civic Hospital Shelter (Cap: 400/400 - FULL)',
    basePriority: 26, // Green / Stable (<50)
    geometry: [
      [26.202, 91.702],
      [26.222, 91.710],
      [26.212, 91.728],
      [26.195, 91.718],
    ],
  },
];

export const INITIAL_ALERTS = [
  {
    id: 'alert-1',
    timestamp: '14:28:10',
    message: 'System Initialized — Brahmaputra river flood monitoring active across Assam sectors.',
    type: 'info',
  },
  {
    id: 'alert-2',
    timestamp: '14:30:45',
    message: 'River Level Alert — Saraighat Gauge measured +1.8m above danger mark.',
    type: 'warning',
  },
  {
    id: 'alert-3',
    timestamp: '14:32:00',
    message: 'CRITICAL WARNING — Guwahati North Sector 7 flood inundation priority elevated to 84 (RED).',
    type: 'critical',
  },
];

export const DENSITY_HEATMAP_POINTS = [
  { lat: 26.202, lng: 91.738, intensity: 0.9, label: 'Sector 7 Riverfront' },
  { lat: 26.192, lng: 91.760, intensity: 0.85, label: 'East Basin Settlement' },
  { lat: 26.168, lng: 91.742, intensity: 0.75, label: 'Kamrup Transit Center' },
  { lat: 26.212, lng: 91.715, intensity: 0.6, label: 'Foothills Reserve Edge' },
];
