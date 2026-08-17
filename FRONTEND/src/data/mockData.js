// Mock Data for SentinelPlan - Nagpur Flood Response, Maharashtra, India

export const DEMO_SCENARIO_SUBTITLE = "Nagpur Municipal Corporation · Nag & Pili River Flood Command System";

export const INITIAL_STATS = {
  activeZonesCount: 4,
  peopleExposed: 5800,
  housesExposed: 1670,
  respondersDeployed: 12,
  respondersAvailable: 20,
  sheltersAtCapacity: 2,
  sheltersTotal: 5,
};

// Nagpur Rivers Data for 3D Visualizer
export const NAGPUR_RIVERS = [
  {
    id: 'nag-river',
    name: 'Nag River Main Channel',
    color: '#06b6d4',
    waterSurgeMeters: 1.4,
    flowRateCubicMeters: 380,
    coordinates: [
      [79.030, 21.128],
      [79.045, 21.135],
      [79.060, 21.140],
      [79.075, 21.146],
      [79.088, 21.148],
      [79.102, 21.152],
      [79.120, 21.158],
    ]
  },
  {
    id: 'pili-river',
    name: 'Pili River North Branch',
    color: '#3b82f6',
    waterSurgeMeters: 1.1,
    flowRateCubicMeters: 290,
    coordinates: [
      [79.050, 21.185],
      [79.070, 21.180],
      [79.090, 21.176],
      [79.110, 21.172],
      [79.135, 21.168],
    ]
  }
];

export const INITIAL_ROADS = [
  {
    id: 'road-1',
    name: 'Manish Nagar Railway Underpass Corridor',
    status: 'blocked',
    type: 'Critical Underpass',
    connectsZoneIds: ['zone-1'],
    geometry: [
      [21.102, 79.070],
      [21.108, 79.078],
      [21.115, 79.085],
    ],
  },
  {
    id: 'road-2',
    name: 'Narendra Nagar Flyover & Arterial Belt',
    status: 'blocked',
    type: 'Urban Highway',
    connectsZoneIds: ['zone-2'],
    geometry: [
      [21.115, 79.080],
      [21.125, 79.088],
      [21.132, 79.095],
    ],
  },
  {
    id: 'road-3',
    name: 'Wardha Road Highway (NH-44)',
    status: 'open',
    type: 'Primary Highway',
    connectsZoneIds: ['zone-1', 'zone-3'],
    geometry: [
      [21.090, 79.055],
      [21.115, 79.060],
      [21.135, 79.065],
      [21.150, 79.075],
    ],
  },
  {
    id: 'road-4',
    name: 'Nag River Sitabuldi Metro Corridor',
    status: 'open',
    type: 'Secondary Arterial',
    connectsZoneIds: ['zone-2', 'zone-3'],
    geometry: [
      [21.140, 79.070],
      [21.148, 79.082],
      [21.155, 79.092],
    ],
  },
  {
    id: 'road-5',
    name: 'Kamptee Road Pili River Bridge (NH-53)',
    status: 'open',
    type: 'Bridge Crossing',
    connectsZoneIds: ['zone-4'],
    geometry: [
      [21.168, 79.100],
      [21.180, 79.112],
      [21.192, 79.125],
    ],
  },
];

// Nagpur Hazard Zones centered around 21.125 - 21.165 N, 79.050 - 79.110 E
export const INITIAL_ZONES = [
  {
    id: 'zone-1',
    name: 'Manish Nagar Underpass Belt',
    peopleExposed: 2800,
    housesExposed: 640,
    residentialUnits: 512,
    commercialUnits: 128,
    status: 'Assigned',
    recommendedResponders: 6,
    assignedSquad: 'Squad Delta-1',
    assignedRespondersCount: 6,
    roadIds: ['road-1', 'road-3'],
    nearestShelter: 'Ambazari Relief Center (Cap: 450/600)',
    basePriority: 91, // Red / Critical
    severity: 'red',
    severityColor: '#ef4444',
    inundationDepthMeters: 2.1,
    geometry: [
      [21.100, 79.065],
      [21.115, 79.072],
      [21.110, 79.088],
      [21.096, 79.080],
    ],
  },
  {
    id: 'zone-2',
    name: 'Narendra Nagar Low-Lying Blocks',
    peopleExposed: 1600,
    housesExposed: 480,
    residentialUnits: 384,
    commercialUnits: 96,
    status: 'Assigned',
    recommendedResponders: 4,
    assignedSquad: 'Squad Bravo-3',
    assignedRespondersCount: 4,
    roadIds: ['road-2', 'road-4'],
    nearestShelter: "St. Xavier's Relief Hall (Cap: 800/1000)",
    basePriority: 78, // Red / Critical
    severity: 'red',
    severityColor: '#ef4444',
    inundationDepthMeters: 1.6,
    geometry: [
      [21.118, 79.075],
      [21.132, 79.082],
      [21.128, 79.098],
      [21.112, 79.090],
    ],
  },
  {
    id: 'zone-3',
    name: 'Somalwada Underpass Corridor',
    peopleExposed: 900,
    housesExposed: 310,
    residentialUnits: 248,
    commercialUnits: 62,
    status: 'Assigned',
    recommendedResponders: 3,
    assignedSquad: 'Alpha Tactical Unit',
    assignedRespondersCount: 3,
    roadIds: ['road-3', 'road-4'],
    nearestShelter: 'Guwanti Stadium Complex (Cap: 200/500)',
    basePriority: 64, // Amber / Warning
    severity: 'amber',
    severityColor: '#f59e0b',
    inundationDepthMeters: 0.9,
    geometry: [
      [21.130, 79.055],
      [21.145, 79.062],
      [21.140, 79.078],
      [21.125, 79.070],
    ],
  },
  {
    id: 'zone-4',
    name: 'Pili – Pora Nullah Settlement Belt',
    peopleExposed: 500,
    housesExposed: 240,
    residentialUnits: 192,
    commercialUnits: 48,
    status: 'Assigned',
    recommendedResponders: 2,
    assignedSquad: 'Eco Rescue Squad-4',
    assignedRespondersCount: 2,
    roadIds: ['road-5'],
    nearestShelter: 'Civic Hospital Shelter (Cap: 180/300)',
    basePriority: 42, // Green / Stable
    severity: 'green',
    severityColor: '#10b981',
    inundationDepthMeters: 0.5,
    geometry: [
      [21.165, 79.095],
      [21.182, 79.102],
      [21.178, 79.118],
      [21.160, 79.110],
    ],
  },
];

export const INITIAL_ALERTS = [
  {
    id: 'alert-1',
    timestamp: '21:34:02',
    message: 'EVENT System initialized — Nag & Pili River telemetry active across Nagpur sectors.',
    type: 'info',
  },
  {
    id: 'alert-2',
    timestamp: '21:31:18',
    message: 'ALERT River level alert — Nag River gauge measured +0.9m above danger mark.',
    type: 'warning',
  },
  {
    id: 'alert-3',
    timestamp: '21:27:45',
    message: 'CRITICAL CRITICAL — Manish Nagar underpass inundation priority elevated to 91 (RED).',
    type: 'critical',
  },
];

export const DENSITY_HEATMAP_POINTS = [
  { lat: 21.108, lng: 79.075, intensity: 0.98, label: 'Manish Nagar Underpass Submersion' },
  { lat: 21.124, lng: 79.085, intensity: 0.88, label: 'Narendra Nagar Water Logging' },
  { lat: 21.138, lng: 79.065, intensity: 0.72, label: 'Somalwada Lowland Overflow' },
  { lat: 21.172, lng: 79.105, intensity: 0.65, label: 'Pili River Catchment Basin' },
];

