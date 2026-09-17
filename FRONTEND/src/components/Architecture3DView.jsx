import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  Layers,
  Database,
  Cpu,
  ShieldCheck,
  Radio,
  Activity,
  RotateCcw,
  Sparkles,
  Zap,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Server,
  Lock,
  Compass,
  FileCode,
  HardDrive,
  GitBranch,
  Table,
  Workflow,
  Wifi,
  Play,
  Pause,
  Box,
  CornerDownRight,
  Maximize2
} from 'lucide-react';

// Data Architecture Nodes Definition
const ARCHITECTURE_NODES = [
  // LAYER 1: DATA INGESTION & SPATIAL STORAGE (Bottom Y ~ -3.5)
  {
    id: 'node-sat-ingester',
    name: 'Satellite & Sensor Ingester',
    layer: 1,
    layerName: 'Layer 1: Ingestion & Spatial Storage',
    pos: [-8, -3.5, 4],
    tech: ['Sentinel-2 L2A', 'Radarsat SAR', 'FastAPI', 'Apache Kafka'],
    status: 'healthy',
    type: 'ingestion',
    description: 'High-throughput ingestion pipeline fetching optical/SAR imagery and 150+ IoT river telemetry sensors.',
    metrics: { throughput: '1.4 GB/s', latency: '120ms', status: 'Healthy (99.9%)' }
  },
  {
    id: 'node-stac-catalog',
    name: 'STAC Catalog Service',
    layer: 1,
    layerName: 'Layer 1: Ingestion & Spatial Storage',
    pos: [-4, -3.5, 2],
    tech: ['PySTAC', 'S3 GeoTIFF', 'FastAPI', 'Elasticsearch'],
    status: 'healthy',
    type: 'service',
    description: 'SpatioTemporal Asset Catalog indexing cloud-native geotiffs (COG) and satellite acquisitions for Nagpur.',
    metrics: { throughput: '450 req/s', latency: '18ms', status: 'Healthy' }
  },
  {
    id: 'node-postgis-db',
    name: 'PostGIS Spatial Database',
    layer: 1,
    layerName: 'Layer 1: Ingestion & Spatial Storage',
    pos: [0, -3.5, 0],
    isCrystal: true,
    tech: ['PostgreSQL 16', 'PostGIS 3.4', 'pg_routing', 'SpatioTemporal Index'],
    status: 'healthy',
    type: 'database',
    description: 'Core geospatial database hosting spatial geometries for Nagpur Municipal Corporation (NMC) flood zones.',
    metrics: { throughput: '8,400 QPS', latency: '3.8ms', status: 'Optimal' },
    tables: [
      { name: 'zones', geom: 'MultiPolygon', desc: 'NMC ward boundaries & risk polygons' },
      { name: 'rivers', geom: 'MultiLineString', desc: 'Nag River, Pili Nadi, Pora River channels' },
      { name: 'nullahs', geom: 'MultiLineString', desc: 'Primary stormwater drains & spillways' },
      { name: 'shelters', geom: 'Point', desc: 'Relief camps, schools, capacity limits' },
      { name: 'critical_infra', geom: 'Point', desc: 'Hospitals, power sub-stations, fire centers' },
      { name: 'flood_hotspots', geom: 'Polygon', desc: 'Historically inundated low-lying areas' },
      { name: 'sensors + readings', geom: 'Point + TS', desc: 'Telemetry water level gauge stream' },
      { name: 'hazard_events', geom: 'MultiPolygon', desc: 'Live flood extend boundaries' },
      { name: 'response_plans + actions', geom: 'Relational Graph', desc: 'Approved evacuation squad routes' },
    ]
  },
  {
    id: 'node-obj-storage',
    name: 'Object Storage (COG & GeoParquet)',
    layer: 1,
    layerName: 'Layer 1: Ingestion & Spatial Storage',
    pos: [4, -3.5, 2],
    tech: ['MinIO / AWS S3', 'Cloud-Optimized GeoTIFF', 'Apache Parquet'],
    status: 'healthy',
    type: 'storage',
    description: 'Distributed object store retaining multi-spectral satellite rasters and vectorized flood geometries.',
    metrics: { throughput: '3.2 GB/s', latency: '42ms', status: 'Healthy' }
  },
  {
    id: 'node-timeseries-db',
    name: 'Time-Series Database',
    layer: 1,
    layerName: 'Layer 1: Ingestion & Spatial Storage',
    pos: [8, -3.5, 4],
    tech: ['TimescaleDB', 'InfluxDB', 'Grafana Analytics'],
    status: 'degraded',
    type: 'database',
    description: 'High-frequency telemetry log for rainfall gauges and river crest water level indicators.',
    metrics: { throughput: '12,000 pts/s', latency: '14ms', status: 'Degraded Sync (Retry Backoff)' }
  },

  // LAYER 2: DETECTION & CHANGE DETECTION (Y ~ -1.2)
  {
    id: 'node-multimodal-detection',
    name: 'Multi-Modal Hazard Detection Engine',
    layer: 2,
    layerName: 'Layer 2: Detection & Change Detection',
    pos: [-6, -1.2, 1],
    tech: ['Optical + SAR Fusion', 'ResNet-18 UNet', 'PyTorch 2.2', 'CUDA 12'],
    status: 'healthy',
    type: 'ai-engine',
    description: 'Deep learning pipeline fusing Sentinel-1 SAR radar and optical sensors to delineate flood surface area.',
    metrics: { throughput: '30 FPS', accuracy: '96.4% IoU', status: 'Active GPU Cluster' }
  },
  {
    id: 'node-uncertainty-quant',
    name: 'Uncertainty Quantification Service',
    layer: 2,
    layerName: 'Layer 2: Detection & Change Detection',
    pos: [-2, -1.2, -1],
    tech: ['Monte Carlo Dropout', 'Conformal Prediction', 'Scikit-Learn'],
    status: 'healthy',
    type: 'ai-engine',
    description: 'Generates confidence intervals (p=0.95) for inundated boundaries and sensor noise rejection.',
    metrics: { throughput: '1,200 evals/s', latency: '24ms', status: 'Healthy' }
  },
  {
    id: 'node-foundation-models',
    name: 'Foundation Model Inference Cluster',
    layer: 2,
    layerName: 'Layer 2: Detection & Change Detection',
    pos: [2, -1.2, -1],
    tech: ['Prithvi Earth FM', 'Clay GeoFM', 'TensorRT-LLM'],
    status: 'healthy',
    type: 'ai-engine',
    description: 'Geo-spatial foundation model computing rapid zero-shot flood propagation predictions.',
    metrics: { throughput: '180 inference/s', latency: '85ms', status: 'Healthy' }
  },
  {
    id: 'node-missing-data-robust',
    name: 'Cloud & Missing-data Robustness',
    layer: 2,
    layerName: 'Layer 2: Detection & Change Detection',
    pos: [6, -1.2, 1],
    tech: ['SAR Cloud-Penetration Imputer', 'Kálmán Filtering'],
    status: 'healthy',
    type: 'service',
    description: 'Fills optical coverage gaps during heavy monsoon cloud cover using synthetic aperture radar.',
    metrics: { throughput: '100% cloud fill', latency: '31ms', status: 'Healthy' }
  },

  // LAYER 3: CENTRAL CORE - EVENT DIGITAL TWIN + POSTGIS ENGINE (Center Y = 0)
  {
    id: 'node-digital-twin-core',
    name: 'Event Digital Twin + PostGIS Spatial Engine',
    layer: 3,
    layerName: 'Layer 3: Central Volumetric Core',
    pos: [0, 0.5, 0],
    isCentralCore: true,
    tech: ['Spatial Engine 3D', 'PostGIS 3D Vector Tiles', 'NetworkX Graph Engine', 'WebGL Stream'],
    status: 'healthy',
    type: 'core',
    description: 'Pulsing 3D Volumetric Digital Twin synthesising real-time Nag/Pili River flow, flooded zones, shelters, and cascading failure graph.',
    metrics: { livePolygonCount: '1,420', confidence: '98.7%', syncRate: '100 Hz', status: 'LIVE PULSE OPERATIONAL' }
  },

  // LAYER 4: AGENTIC PLANNING LAYER (Y ~ 2.2)
  {
    id: 'node-perception-agent',
    name: 'Perception Agents',
    layer: 4,
    layerName: 'Layer 4: Agentic Planning Layer',
    pos: [-6, 2.2, -1],
    tech: ['LangGraph', 'ReAct Agent', 'Spatial SQL Tool'],
    status: 'healthy',
    type: 'agent',
    description: 'Autonomous spatial agents monitoring river height spikes and triggering emergency evacuation bounds.',
    metrics: { executionCycle: '500ms', activeAgents: '12', status: 'Monitoring Nag River' }
  },
  {
    id: 'node-impact-cascade-agent',
    name: 'Impact & Cascade Agents',
    layer: 4,
    layerName: 'Layer 4: Agentic Planning Layer',
    pos: [-2, 2.2, 1],
    tech: ['Graph Neural Network', 'Cascading Failure Solver'],
    status: 'healthy',
    type: 'agent',
    description: 'Simulates secondary impacts: power sub-station submergence, hospital isolation, and road blockages.',
    metrics: { scenarioDepth: '5 steps', graphEdges: '3,800', status: 'Healthy' }
  },
  {
    id: 'node-response-planner',
    name: 'Response Planner Agents',
    layer: 4,
    layerName: 'Layer 4: Agentic Planning Layer',
    pos: [2, 2.2, 1],
    tech: ['Constraint Optimization', 'OR-Tools', 'pg_routing'],
    status: 'healthy',
    type: 'agent',
    description: 'Calculates optimal evacuation routes, responder squad allocations, and shelter logistics.',
    metrics: { routeComputeTime: '45ms', squadAssignments: '24', status: 'Healthy' }
  },
  {
    id: 'node-approval-gateway',
    name: 'Human Approval Gateway',
    layer: 4,
    layerName: 'Layer 4: Agentic Planning Layer',
    pos: [6, 2.2, -1],
    isApprovalGateway: true,
    tech: ['Holographic Lock Security', 'Commander Role Access', 'Audit Log JWT'],
    status: 'healthy',
    type: 'gateway',
    description: 'Secure Commander Approval Gate requiring human sign-off before dispatching emergency sirens or road barricades.',
    metrics: { approvalState: 'AWAITING COMMANDER SIGN-OFF', pendingActionCount: '2 Action Drafts' }
  },

  // LAYER 5: DELIVERY & RESILIENCE (Y ~ 4.2)
  {
    id: 'node-api-gateway',
    name: 'Real-time API Gateway',
    layer: 5,
    layerName: 'Layer 5: Delivery & Resilience',
    pos: [-7, 4.2, 3],
    tech: ['Kong Gateway', 'gRPC-Web', 'REST API', 'Rate Limiter'],
    status: 'healthy',
    type: 'delivery',
    description: 'High availability entry point serving disaster management field apps and mobile responder units.',
    metrics: { throughput: '15,000 req/s', latency: '6ms', status: 'Healthy' }
  },
  {
    id: 'node-websocket-hub',
    name: 'WebSocket / Live Update Hub',
    layer: 5,
    layerName: 'Layer 5: Delivery & Resilience',
    pos: [-3.5, 4.2, 1],
    tech: ['Socket.io / Redis PubSub', 'Protobuf Streams'],
    status: 'healthy',
    type: 'delivery',
    description: 'Sub-second bi-directional telemetry broadcast channel to Nagpur Command Center screens.',
    metrics: { activeConns: '3,400', latency: '4ms', status: 'Streaming Live' }
  },
  {
    id: 'node-offline-cache',
    name: 'Offline Cache & Queue Manager',
    layer: 5,
    layerName: 'Layer 5: Delivery & Resilience',
    pos: [0, 4.2, -1],
    tech: ['Redis Cluster', 'SQLite PWA Cache', 'ServiceWorker Sync'],
    status: 'healthy',
    type: 'resilience',
    description: 'Stores regional spatial vector tiles offline for first-responders operating in cell dead-zones.',
    metrics: { cachedTiles: '100% Nagpur Sector', offlineSyncReady: 'True' }
  },
  {
    id: 'node-edge-sync',
    name: 'Edge Sync Service',
    layer: 5,
    layerName: 'Layer 5: Delivery & Resilience',
    pos: [3.5, 4.2, 1],
    tech: ['CRDT Vector Sync', 'MQTT Brokering'],
    status: 'healthy',
    type: 'resilience',
    description: 'Ensures bi-directional state synchronization when disconnected rescue teams regain cellular link.',
    metrics: { syncConflictRate: '0.00%', latency: '40ms', status: 'Healthy' }
  },
  {
    id: 'node-alert-prioritizer',
    name: 'Alert Prioritization Engine',
    layer: 5,
    layerName: 'Layer 5: Delivery & Resilience',
    pos: [7, 4.2, 3],
    tech: ['Severity Matrix Evaluator', 'FCM Broadcast Engine'],
    status: 'critical',
    type: 'delivery',
    description: 'Filters and dispatches high priority SOS sirens to citizens in red-alert zones (Corporation Colony / Nag River).',
    metrics: { ActiveEmergencyAlerts: '3 RED SOS ACTIVE', status: 'HIGH ALERT BROADCAST' }
  },

  // LAYER 6: LEARNING & EVALUATION (Top Y ~ 6.2)
  {
    id: 'node-post-evaluation',
    name: 'Post-Event Evaluation Engine',
    layer: 6,
    layerName: 'Layer 6: Learning & Evaluation',
    pos: [-5, 6.2, 2],
    tech: ['Pandas / Polars', 'Post-Mortem ML Pipeline'],
    status: 'healthy',
    type: 'analytics',
    description: 'Analyzes predicted vs actual flood extent to continuously calibrate flood model weights.',
    metrics: { evaluatedEvents: '14 Historical Inundations', status: 'Healthy' }
  },
  {
    id: 'node-iou-calculator',
    name: 'Lead-time / IoU / Calibration Calculator',
    layer: 6,
    layerName: 'Layer 6: Learning & Evaluation',
    pos: [-1.5, 6.2, 0],
    tech: ['Scikit-learn', 'Brier Calibration Score'],
    status: 'healthy',
    type: 'analytics',
    description: 'Computes Intersection-over-Union (IoU) accuracy and lead-time window precision metrics.',
    metrics: { meanIoU: '0.942', leadTimeAccuracy: '4.2 hrs advance warning' }
  },
  {
    id: 'node-model-registry',
    name: 'Model Registry with Governance Gate',
    layer: 6,
    layerName: 'Layer 6: Learning & Evaluation',
    pos: [1.5, 6.2, 0],
    tech: ['MLflow', 'DVC Vector Lineage', 'Governance Gate'],
    status: 'healthy',
    type: 'governance',
    description: 'Audits model versioning, safety constraints, and automated model rollback gates.',
    metrics: { activeVersion: 'v2.4.1-prod', rollbackStatus: 'Ready' }
  },
  {
    id: 'node-sim-replay',
    name: 'Simulation Replay Engine',
    layer: 6,
    layerName: 'Layer 6: Learning & Evaluation',
    pos: [5, 6.2, 2],
    tech: ['DuckDB', 'Deck.gl Time Replay'],
    status: 'healthy',
    type: 'analytics',
    description: 'Replays 4D spatio-temporal flood sequences for commander debriefings and training drills.',
    metrics: { maxReplaySpeed: '60x Realtime', status: 'Standby' }
  }
];

// Pipeline Connections (Source ID -> Target ID, Stream Type)
const PIPELINE_CONNECTIONS = [
  // Layer 1 -> PostGIS / Storage
  { from: 'node-sat-ingester', to: 'node-stac-catalog', type: 'cyan' },
  { from: 'node-sat-ingester', to: 'node-obj-storage', type: 'cyan' },
  { from: 'node-stac-catalog', to: 'node-postgis-db', type: 'cyan' },
  { from: 'node-timeseries-db', to: 'node-postgis-db', type: 'amber' },

  // Layer 1 -> Layer 2 Detection
  { from: 'node-postgis-db', to: 'node-multimodal-detection', type: 'cyan' },
  { from: 'node-obj-storage', to: 'node-multimodal-detection', type: 'cyan' },
  { from: 'node-multimodal-detection', to: 'node-uncertainty-quant', type: 'cyan' },
  { from: 'node-multimodal-detection', to: 'node-foundation-models', type: 'cyan' },
  { from: 'node-missing-data-robust', to: 'node-multimodal-detection', type: 'amber' },

  // Layer 2 -> Layer 3 Central Core
  { from: 'node-uncertainty-quant', to: 'node-digital-twin-core', type: 'cyan' },
  { from: 'node-foundation-models', to: 'node-digital-twin-core', type: 'cyan' },
  { from: 'node-postgis-db', to: 'node-digital-twin-core', type: 'cyan' },

  // Layer 3 Core -> Layer 4 Agents
  { from: 'node-digital-twin-core', to: 'node-perception-agent', type: 'cyan' },
  { from: 'node-perception-agent', to: 'node-impact-cascade-agent', type: 'amber' },
  { from: 'node-impact-cascade-agent', to: 'node-response-planner', type: 'amber' },
  { from: 'node-response-planner', to: 'node-approval-gateway', type: 'green' },

  // Layer 4 Approval -> Layer 5 Delivery
  { from: 'node-approval-gateway', to: 'node-api-gateway', type: 'green' },
  { from: 'node-approval-gateway', to: 'node-alert-prioritizer', type: 'red' },
  { from: 'node-api-gateway', to: 'node-websocket-hub', type: 'cyan' },
  { from: 'node-api-gateway', to: 'node-offline-cache', type: 'cyan' },
  { from: 'node-offline-cache', to: 'node-edge-sync', type: 'cyan' },

  // Layer 5 Delivery -> Layer 6 Learning Loop
  { from: 'node-digital-twin-core', to: 'node-post-evaluation', type: 'cyan' },
  { from: 'node-post-evaluation', to: 'node-iou-calculator', type: 'cyan' },
  { from: 'node-iou-calculator', to: 'node-model-registry', type: 'green' },
  { from: 'node-model-registry', to: 'node-sim-replay', type: 'cyan' },
];

export default function Architecture3DView() {
  const mountRef = useRef(null);
  const [selectedNode, setSelectedNode] = useState(ARCHITECTURE_NODES.find(n => n.id === 'node-postgis-db'));
  const [activePreset, setActivePreset] = useState('overview');
  const [showParticles, setShowParticles] = useState(true);
  const [autoRotate, setAutoRotate] = useState(false);
  const [activeStreamFilter, setActiveStreamFilter] = useState('all');

  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const rendererRef = useRef(null);
  const particlesMeshGroup = useRef([]);
  const targetCamPos = useRef(new THREE.Vector3(0, 2, 22));
  const targetCamLook = useRef(new THREE.Vector3(0, 1, 0));

  const CAMERA_PRESETS = {
    overview: {
      pos: new THREE.Vector3(0, 3, 22),
      look: new THREE.Vector3(0, 1, 0),
      title: 'Full Orbital Overview',
      focusId: null
    },
    postgisCore: {
      pos: new THREE.Vector3(0, -1, 9),
      look: new THREE.Vector3(0, -1.5, 0),
      title: 'Central PostGIS & Digital Twin Core',
      focusId: 'node-postgis-db'
    },
    agenticPlanning: {
      pos: new THREE.Vector3(2, 3, 11),
      look: new THREE.Vector3(1, 2, 0),
      title: 'Agentic Planning & Approval Gateway',
      focusId: 'node-approval-gateway'
    },
    edgeResilience: {
      pos: new THREE.Vector3(2, 5, 12),
      look: new THREE.Vector3(1, 4, 1),
      title: 'Offline Cache & Edge Resilience Path',
      focusId: 'node-offline-cache'
    },
    legendInspector: {
      pos: new THREE.Vector3(-4, 0, 14),
      look: new THREE.Vector3(0, 0, 0),
      title: 'Component Legend & Inspector Mode',
      focusId: 'node-digital-twin-core'
    }
  };

  const handlePresetSelect = (presetKey) => {
    setActivePreset(presetKey);
    const preset = CAMERA_PRESETS[presetKey];
    if (preset) {
      targetCamPos.current.copy(preset.pos);
      targetCamLook.current.copy(preset.look);
      if (preset.focusId) {
        const found = ARCHITECTURE_NODES.find(n => n.id === preset.focusId);
        if (found) setSelectedNode(found);
      }
    }
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x020617);
    scene.fog = new THREE.FogExp2(0x020617, 0.025);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.copy(targetCamPos.current);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 45;
    controls.minDistance = 4;
    controls.target.copy(targetCamLook.current);
    controlsRef.current = controls;

    const ambientLight = new THREE.AmbientLight(0x1e293b, 1.8);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x38bdf8, 2.5);
    dirLight1.position.set(15, 25, 20);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xa855f7, 1.8);
    dirLight2.position.set(-20, -10, -15);
    scene.add(dirLight2);

    const pointLightCore = new THREE.PointLight(0x06b6d4, 4.0, 18);
    pointLightCore.position.set(0, 0.5, 0);
    scene.add(pointLightCore);

    const gridHelper = new THREE.GridHelper(40, 40, 0x06b6d4, 0x1e293b);
    gridHelper.position.y = -5.5;
    gridHelper.material.opacity = 0.35;
    gridHelper.material.transparent = true;
    scene.add(gridHelper);

    const dustGeometry = new THREE.BufferGeometry();
    const dustCount = 800;
    const dustPositions = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount * 3; i++) {
      dustPositions[i] = (Math.random() - 0.5) * 60;
    }
    dustGeometry.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
    const dustMaterial = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.15,
      transparent: true,
      opacity: 0.55
    });
    const dustPoints = new THREE.Points(dustGeometry, dustMaterial);
    scene.add(dustPoints);

    const nodeMeshMap = new Map();

    ARCHITECTURE_NODES.forEach((node) => {
      const group = new THREE.Group();
      group.position.set(...node.pos);
      group.userData = { id: node.id, nodeData: node };

      let mainMesh;

      if (node.isCentralCore) {
        const coreGeo = new THREE.SphereGeometry(1.8, 32, 32);
        const coreMat = new THREE.MeshPhysicalMaterial({
          color: 0x0284c7,
          emissive: 0x0369a1,
          emissiveIntensity: 0.6,
          metalness: 0.1,
          roughness: 0.1,
          transmission: 0.85,
          thickness: 1.2,
          transparent: true,
          opacity: 0.9,
          wireframe: false
        });
        mainMesh = new THREE.Mesh(coreGeo, coreMat);

        const innerGeo = new THREE.IcosahedronGeometry(1.5, 2);
        const innerMat = new THREE.MeshBasicMaterial({
          color: 0x38bdf8,
          wireframe: true,
          transparent: true,
          opacity: 0.4
        });
        const innerMesh = new THREE.Mesh(innerGeo, innerMat);
        group.add(innerMesh);

        const ringGeo = new THREE.TorusGeometry(2.4, 0.04, 16, 64);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4, transparent: true, opacity: 0.8 });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.rotation.x = Math.PI / 2;
        group.add(ringMesh);

        const graphPoints = [
          [-0.6, 0.4, 0.5], [0.5, -0.3, -0.4], [0.2, 0.7, -0.2], [-0.4, -0.6, 0.3]
        ];
        graphPoints.forEach(p => {
          const ptGeo = new THREE.SphereGeometry(0.12, 12, 12);
          const ptMat = new THREE.MeshBasicMaterial({ color: 0xf43f5e });
          const ptMesh = new THREE.Mesh(ptGeo, ptMat);
          ptMesh.position.set(...p);
          group.add(ptMesh);
        });

      } else if (node.isCrystal) {
        const crystalGeo = new THREE.OctahedronGeometry(1.4, 1);
        const crystalMat = new THREE.MeshPhysicalMaterial({
          color: 0x0284c7,
          emissive: 0x0ea5e9,
          emissiveIntensity: 0.8,
          roughness: 0.05,
          metalness: 0.2,
          transmission: 0.7,
          thickness: 1.5,
          transparent: true,
          opacity: 0.95
        });
        mainMesh = new THREE.Mesh(crystalGeo, crystalMat);

        const wireGeo = new THREE.OctahedronGeometry(1.48, 1);
        const wireMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, wireframe: true, transparent: true, opacity: 0.6 });
        const wireMesh = new THREE.Mesh(wireGeo, wireMat);
        group.add(wireMesh);

        if (node.tables) {
          const radius = 2.6;
          node.tables.forEach((tbl, idx) => {
            const angle = (idx / node.tables.length) * Math.PI * 2;
            const tx = Math.cos(angle) * radius;
            const tz = Math.sin(angle) * radius;
            const ty = (idx % 2 === 0 ? 0.4 : -0.4);

            const tblGroup = new THREE.Group();
            tblGroup.position.set(tx, ty, tz);

            let subGeo;
            let subColor = 0x38bdf8;
            if (tbl.geom === 'Point') {
              subGeo = new THREE.SphereGeometry(0.18, 12, 12);
              subColor = 0x38bdf8;
            } else if (tbl.geom.includes('LineString')) {
              subGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.4, 8);
              subColor = 0x3b82f6;
            } else if (tbl.geom.includes('Polygon')) {
              subGeo = new THREE.BoxGeometry(0.3, 0.15, 0.3);
              subColor = 0x06b6d4;
            } else {
              subGeo = new THREE.DodecahedronGeometry(0.2, 0);
              subColor = 0xa855f7;
            }

            const tblMat = new THREE.MeshStandardMaterial({
              color: subColor,
              emissive: subColor,
              emissiveIntensity: 0.6,
              roughness: 0.2
            });
            const tblMesh = new THREE.Mesh(subGeo, tblMat);
            tblGroup.add(tblMesh);

            const lineMat = new THREE.LineBasicMaterial({ color: subColor, transparent: true, opacity: 0.35 });
            const lineGeo = new THREE.BufferGeometry().setFromPoints([
              new THREE.Vector3(0, 0, 0),
              new THREE.Vector3(-tx, -ty, -tz)
            ]);
            const tether = new THREE.Line(lineGeo, lineMat);
            tblGroup.add(tether);

            group.add(tblGroup);
          });
        }

      } else if (node.isApprovalGateway) {
        const gateGeo = new THREE.CylinderGeometry(1.0, 1.0, 0.6, 24);
        const gateMat = new THREE.MeshStandardMaterial({
          color: 0x0f172a,
          metalness: 0.8,
          roughness: 0.2,
          emissive: 0x22c55e,
          emissiveIntensity: 0.3
        });
        mainMesh = new THREE.Mesh(gateGeo, gateMat);

        const lockRingGeo = new THREE.TorusGeometry(1.3, 0.05, 16, 48);
        const lockRingMat = new THREE.MeshBasicMaterial({ color: 0x22c55e });
        const lockRingMesh = new THREE.Mesh(lockRingGeo, lockRingMat);
        lockRingMesh.rotation.x = Math.PI / 2;
        group.add(lockRingMesh);

      } else {
        const boxGeo = new THREE.BoxGeometry(1.4, 0.7, 0.9);
        let emissiveColor = 0x0284c7;
        if (node.status === 'degraded') emissiveColor = 0xd97706;
        if (node.status === 'critical') emissiveColor = 0xd97706;

        const boxMat = new THREE.MeshPhysicalMaterial({
          color: 0x0f172a,
          emissive: emissiveColor,
          emissiveIntensity: 0.35,
          roughness: 0.2,
          metalness: 0.5,
          transmission: 0.4,
          transparent: true,
          opacity: 0.9
        });
        mainMesh = new THREE.Mesh(boxGeo, boxMat);

        const beaconGeo = new THREE.SphereGeometry(0.12, 12, 12);
        let beaconColor = 0x38bdf8;
        if (node.status === 'degraded') beaconColor = 0xf59e0b;
        if (node.status === 'critical') beaconColor = 0xef4444;
        const beaconMat = new THREE.MeshBasicMaterial({ color: beaconColor });
        const beaconMesh = new THREE.Mesh(beaconGeo, beaconMat);
        beaconMesh.position.set(0, 0.45, 0);
        group.add(beaconMesh);
      }

      group.add(mainMesh);
      scene.add(group);
      nodeMeshMap.set(node.id, group);
    });

    const pipelineLineGroup = new THREE.Group();
    const particleList = [];

    PIPELINE_CONNECTIONS.forEach((conn) => {
      const sourceNode = ARCHITECTURE_NODES.find(n => n.id === conn.from);
      const targetNode = ARCHITECTURE_NODES.find(n => n.id === conn.to);
      if (!sourceNode || !targetNode) return;

      const p1 = new THREE.Vector3(...sourceNode.pos);
      const p2 = new THREE.Vector3(...targetNode.pos);

      const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
      mid.y += 0.8;

      const curve = new THREE.QuadraticBezierCurve3(p1, mid, p2);
      const points = curve.getPoints(30);
      const curveGeo = new THREE.BufferGeometry().setFromPoints(points);

      let streamColor = 0x38bdf8;
      if (conn.type === 'amber') streamColor = 0xf59e0b;
      if (conn.type === 'green') streamColor = 0x22c55e;
      if (conn.type === 'red') streamColor = 0xef4444;

      const lineMat = new THREE.LineBasicMaterial({
        color: streamColor,
        transparent: true,
        opacity: 0.5,
        linewidth: 2
      });

      const lineMesh = new THREE.Line(curveGeo, lineMat);
      lineMesh.userData = { streamType: conn.type };
      pipelineLineGroup.add(lineMesh);

      const pGeo = new THREE.SphereGeometry(0.1, 8, 8);
      const pMat = new THREE.MeshBasicMaterial({ color: streamColor });
      const pMesh = new THREE.Mesh(pGeo, pMat);
      pMesh.userData = { curve, progress: Math.random(), speed: 0.004 + Math.random() * 0.003, streamType: conn.type };
      scene.add(pMesh);
      particleList.push(pMesh);
    });

    scene.add(pipelineLineGroup);
    particlesMeshGroup.current = particleList;

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerDown = (event) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(scene.children, true);

      for (let i = 0; i < intersects.length; i++) {
        let obj = intersects[i].object;
        while (obj && !obj.userData?.nodeData && obj.parent) {
          obj = obj.parent;
        }
        if (obj && obj.userData?.nodeData) {
          setSelectedNode(obj.userData.nodeData);
          break;
        }
      }
    };

    renderer.domElement.addEventListener('pointerdown', handlePointerDown);

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    let animationFrameId;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      controls.update();

      camera.position.lerp(targetCamPos.current, 0.05);
      controls.target.lerp(targetCamLook.current, 0.05);

      if (autoRotate) {
        scene.rotation.y = elapsedTime * 0.12;
      } else {
        scene.rotation.y = 0;
      }

      nodeMeshMap.forEach((group) => {
        const initialY = group.userData.nodeData.pos[1];
        group.position.y = initialY + Math.sin(elapsedTime * 1.8 + group.position.x) * 0.08;

        if (group.userData.nodeData.isCentralCore || group.userData.nodeData.isCrystal) {
          group.rotation.y = elapsedTime * 0.4;
        }
      });

      if (showParticles) {
        particleList.forEach((pMesh) => {
          const { curve, speed, streamType } = pMesh.userData;

          if (activeStreamFilter !== 'all' && streamType !== activeStreamFilter) {
            pMesh.visible = false;
          } else {
            pMesh.visible = true;
            pMesh.userData.progress += speed;
            if (pMesh.userData.progress > 1) pMesh.userData.progress = 0;
            const pt = curve.getPoint(pMesh.userData.progress);
            pMesh.position.copy(pt);
          }
        });
      }

      renderer.render(scene, camera);
    };

    const resizeObserver = new ResizeObserver(() => {
      if (!mountRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      if (w > 0 && h > 0) {
        cameraRef.current.aspect = w / h;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(w, h);
      }
    });
    resizeObserver.observe(container);

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [autoRotate, showParticles, activeStreamFilter]);

  return (
    <div className="relative w-full h-[calc(100vh-4rem)] bg-[#020617] text-slate-100 overflow-hidden font-sans select-none">
      <div ref={mountRef} className="absolute inset-0 z-0 cursor-grab active:cursor-grabbing" />

      {/* TOP HEADER: HOLOGRAPHIC TITLE & SYSTEM METRICS BAR */}
      <div className="absolute top-4 left-4 right-4 z-10 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        <div className="pointer-events-auto bg-slate-950/80 backdrop-blur-md border border-cyan-500/30 rounded-2xl px-4 py-2.5 shadow-2xl shadow-cyan-950/40 flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-br from-cyan-500/20 to-blue-600/30 rounded-xl border border-cyan-400/40">
            <Cpu className="w-5 h-5 text-cyan-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-sm font-bold tracking-wider uppercase text-white font-mono">
                Nagpur Disaster Management System
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                POSTGIS 3D TWIN
              </span>
            </div>
            <p className="text-xs text-cyan-300/70 font-mono">
              3D Holographic Spatial Architecture & Pipeline Telemetry
            </p>
          </div>
        </div>

        <div className="pointer-events-auto hidden md:flex items-center space-x-4 bg-slate-950/80 backdrop-blur-md border border-slate-800 rounded-2xl px-4 py-2 text-xs font-mono">
          <div className="flex items-center space-x-2">
            <Server className="w-4 h-4 text-cyan-400" />
            <span className="text-slate-400">Active Microservices:</span>
            <span className="text-cyan-400 font-bold">22 / 22 ONLINE</span>
          </div>
          <div className="w-px h-4 bg-slate-800" />
          <div className="flex items-center space-x-2">
            <GitBranch className="w-4 h-4 text-emerald-400" />
            <span className="text-slate-400">Pipelines:</span>
            <span className="text-emerald-400 font-bold">24 Active Streams</span>
          </div>
          <div className="w-px h-4 bg-slate-800" />
          <div className="flex items-center space-x-2">
            <Database className="w-4 h-4 text-amber-400" />
            <span className="text-slate-400">PostGIS Latency:</span>
            <span className="text-amber-400 font-bold">3.8 ms</span>
          </div>
        </div>
      </div>

      {/* LEFT FLOATING CONTROL PANEL */}
      <div className="absolute top-20 left-4 z-10 space-y-3 pointer-events-auto max-w-[240px]">
        <div className="bg-slate-950/85 backdrop-blur-md border border-slate-800/80 rounded-2xl p-3.5 shadow-xl space-y-2.5">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center justify-between">
            <span>Pipeline Streams</span>
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
          </div>

          <div className="space-y-1.5 text-xs font-medium">
            <button
              onClick={() => setActiveStreamFilter('all')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl border text-left transition-all ${
                activeStreamFilter === 'all'
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 font-bold'
                  : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>All Active Pipelines</span>
              <span className="text-[10px] font-mono bg-slate-800 px-1.5 py-0.5 rounded">24</span>
            </button>

            <button
              onClick={() => setActiveStreamFilter('cyan')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl border text-left transition-all ${
                activeStreamFilter === 'cyan'
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold'
                  : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span>Real-time Spatial</span>
              </span>
              <span className="text-[10px] font-mono text-cyan-400">CYAN</span>
            </button>

            <button
              onClick={() => setActiveStreamFilter('amber')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl border text-left transition-all ${
                activeStreamFilter === 'amber'
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold'
                  : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span>Sensor Streams</span>
              </span>
              <span className="text-[10px] font-mono text-amber-400">AMBER</span>
            </button>

            <button
              onClick={() => setActiveStreamFilter('green')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl border text-left transition-all ${
                activeStreamFilter === 'green'
                  ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 font-bold'
                  : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Approved Actions</span>
              </span>
              <span className="text-[10px] font-mono text-emerald-400">GREEN</span>
            </button>

            <button
              onClick={() => setActiveStreamFilter('red')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl border text-left transition-all ${
                activeStreamFilter === 'red'
                  ? 'bg-rose-500/20 border-rose-400 text-rose-300 font-bold'
                  : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
                <span>Critical Alerts</span>
              </span>
              <span className="text-[10px] font-mono text-rose-400">RED</span>
            </button>
          </div>

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
            <button
              onClick={() => setShowParticles(!showParticles)}
              className="text-slate-400 hover:text-cyan-300 flex items-center space-x-1 font-mono text-[11px]"
            >
              {showParticles ? <Pause className="w-3 h-3 text-cyan-400" /> : <Play className="w-3 h-3 text-slate-400" />}
              <span>{showParticles ? 'Flow Particles ON' : 'Flow Particles OFF'}</span>
            </button>

            <button
              onClick={() => setAutoRotate(!autoRotate)}
              className={`p-1.5 rounded-lg border text-xs transition-colors ${
                autoRotate ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300' : 'bg-slate-900 border-slate-800 text-slate-400'
              }`}
              title="Toggle Auto Orbit Rotation"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="bg-slate-950/85 backdrop-blur-md border border-slate-800/80 rounded-2xl p-3 shadow-xl space-y-2 font-mono text-[11px]">
          <div className="text-slate-400 uppercase font-bold text-[10px] tracking-wider">
            PostGIS Geometries
          </div>
          <div className="grid grid-cols-2 gap-1.5 text-slate-300">
            <div className="flex items-center space-x-1.5 bg-slate-900/80 px-2 py-1 rounded-lg">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <span>Point</span>
            </div>
            <div className="flex items-center space-x-1.5 bg-slate-900/80 px-2 py-1 rounded-lg">
              <span className="w-2 h-0.5 bg-blue-500" />
              <span>LineString</span>
            </div>
            <div className="flex items-center space-x-1.5 bg-slate-900/80 px-2 py-1 rounded-lg">
              <span className="w-2 h-2 border border-cyan-400 bg-cyan-500/30" />
              <span>Polygon</span>
            </div>
            <div className="flex items-center space-x-1.5 bg-slate-900/80 px-2 py-1 rounded-lg">
              <span className="w-2.5 h-2.5 border border-purple-400 bg-purple-500/30" />
              <span>MultiPoly</span>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT FLOATING GLASSMORPHIC INSPECTOR SIDEBAR */}
      {selectedNode && (
        <div className="absolute top-20 right-4 z-20 w-80 md:w-96 bg-slate-950/90 backdrop-blur-xl border border-cyan-500/30 rounded-2xl p-5 shadow-2xl shadow-cyan-950/50 space-y-4 pointer-events-auto transition-all animate-fadeIn">
          <div className="flex items-start justify-between border-b border-slate-800/80 pb-3">
            <div className="space-y-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded-full">
                {selectedNode.layerName}
              </span>
              <h2 className="text-base font-bold text-white leading-tight font-sans">
                {selectedNode.name}
              </h2>
            </div>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                selectedNode.status === 'healthy'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : selectedNode.status === 'degraded'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              }`}
            >
              {selectedNode.status}
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed font-sans">
            {selectedNode.description}
          </p>

          <div className="space-y-1.5">
            <div className="text-[10px] font-mono text-slate-400 uppercase font-bold tracking-wider flex items-center space-x-1">
              <FileCode className="w-3 h-3 text-cyan-400" />
              <span>Technology Stack</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {selectedNode.tech.map((t, i) => (
                <span
                  key={i}
                  className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono text-cyan-300"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>

          {selectedNode.metrics && (
            <div className="bg-slate-900/90 rounded-xl p-3 border border-slate-800 space-y-2 font-mono text-xs">
              <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider flex items-center justify-between">
                <span>Realtime Telemetry</span>
                <Activity className="w-3 h-3 text-emerald-400 animate-pulse" />
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1 text-slate-200">
                {Object.entries(selectedNode.metrics).map(([k, v]) => (
                  <div key={k} className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                    <div className="text-[9px] text-slate-400 uppercase">{k}</div>
                    <div className="font-bold text-cyan-300 text-xs truncate">{v}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedNode.tables && (
            <div className="space-y-2">
              <div className="text-[10px] font-mono text-slate-400 uppercase font-bold tracking-wider flex items-center space-x-1">
                <Table className="w-3.5 h-3.5 text-cyan-400" />
                <span>PostGIS Geospatial Schema Tables</span>
              </div>
              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 font-mono text-[11px] custom-scrollbar">
                {selectedNode.tables.map((tbl, i) => (
                  <div
                    key={i}
                    className="p-2 bg-slate-900/80 rounded-xl border border-slate-800/80 hover:border-cyan-500/40 transition-colors flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-cyan-200 flex items-center space-x-1.5">
                        <span>{tbl.name}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-sans">{tbl.desc}</div>
                    </div>
                    <span className="px-1.5 py-0.5 rounded text-[9px] bg-cyan-950 text-cyan-400 border border-cyan-800 font-bold">
                      {tbl.geom}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedNode.isApprovalGateway && (
            <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl space-y-2">
              <div className="flex items-center space-x-2 text-emerald-300 font-bold text-xs font-mono">
                <Lock className="w-4 h-4 text-emerald-400" />
                <span>HOLOGRAPHIC SECURITY GATEWAY</span>
              </div>
              <p className="text-[11px] text-emerald-200/80">
                Awaiting Commander authentication token to authorize mass SMS alerts & automated flood barrier deployments.
              </p>
              <button
                onClick={() => alert('COMMANDER VERIFIED: Action Plan #402 Authorized & Dispatched to Edge Units')}
                className="w-full py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/50 cursor-pointer transition-all active:scale-95"
              >
                AUTHORIZE RESPONSE PLAN
              </button>
            </div>
          )}
        </div>
      )}

      {/* BOTTOM FLOATING CAMERA PRESET DOCK */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
        <div className="bg-slate-950/90 backdrop-blur-xl border border-cyan-500/30 rounded-2xl p-2 shadow-2xl shadow-cyan-950/60 flex items-center space-x-1 sm:space-x-2">
          {Object.entries(CAMERA_PRESETS).map(([key, preset]) => (
            <button
              key={key}
              onClick={() => handlePresetSelect(key)}
              className={`px-3 py-2 rounded-xl text-xs font-mono font-medium transition-all duration-200 flex items-center space-x-2 cursor-pointer ${
                activePreset === key
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold shadow-lg shadow-cyan-500/30 border border-cyan-400'
                  : 'bg-slate-900/80 text-slate-400 hover:text-slate-100 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              {key === 'overview' && <Compass className="w-3.5 h-3.5" />}
              {key === 'postgisCore' && <Database className="w-3.5 h-3.5 text-cyan-400" />}
              {key === 'agenticPlanning' && <Lock className="w-3.5 h-3.5 text-emerald-400" />}
              {key === 'edgeResilience' && <Wifi className="w-3.5 h-3.5 text-amber-400" />}
              {key === 'legendInspector' && <Layers className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{preset.title}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
