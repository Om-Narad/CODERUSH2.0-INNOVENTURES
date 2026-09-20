-- =============================================================================
-- Nagpur Flood Safe — Drainage Sensor Network PostGIS Schema Migration
-- =============================================================================

-- Ensure PostGIS extension is enabled
CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. DRAIN SEGMENTS TABLE
CREATE TABLE IF NOT EXISTS drain_segments (
    segment_id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    watercourse_id VARCHAR(64) NOT NULL,
    geom GEOMETRY(LineString, 4326) NOT NULL,
    diameter_mm NUMERIC(8,2) DEFAULT 1200.0,
    design_capacity_lps NUMERIC(10,2) DEFAULT 850.0,
    last_desilted_on DATE,
    silt_risk_level VARCHAR(32) DEFAULT 'medium' CHECK (silt_risk_level IN ('high', 'medium', 'low'))
);

CREATE INDEX IF NOT EXISTS idx_drain_segments_geom ON drain_segments USING GIST (geom);

-- 2. SENSOR DEVICES TABLE
CREATE TABLE IF NOT EXISTS sensor_devices (
    device_id VARCHAR(64) PRIMARY KEY,
    label VARCHAR(255) NOT NULL,
    sensor_type VARCHAR(64) NOT NULL CHECK (sensor_type IN ('water_level', 'flow_rate', 'rainfall', 'ultrasonic_distance')),
    geom GEOMETRY(Point, 4326) NOT NULL,
    installed_depth_cm NUMERIC(8,2) DEFAULT 150.0,
    drain_segment_id VARCHAR(64) REFERENCES drain_segments(segment_id) ON DELETE SET NULL,
    upstream_sensor_id VARCHAR(64) REFERENCES sensor_devices(device_id) ON DELETE SET NULL,
    battery_pct NUMERIC(5,2) DEFAULT 95.0,
    signal_strength NUMERIC(5,2) DEFAULT -68.0,
    firmware_version VARCHAR(64) DEFAULT 'v2.4.1-nagpur',
    last_heartbeat_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    health_status VARCHAR(32) DEFAULT 'online' CHECK (health_status IN ('online', 'degraded', 'offline', 'maintenance')),
    warning_threshold_cm NUMERIC(8,2) DEFAULT 50.0,
    critical_threshold_cm NUMERIC(8,2) DEFAULT 80.0,
    expected_drain_rate_cm_per_min NUMERIC(8,2) DEFAULT 2.5
);

CREATE INDEX IF NOT EXISTS idx_sensor_devices_geom ON sensor_devices USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_sensor_devices_segment ON sensor_devices(drain_segment_id);

-- 3. SENSOR READINGS TABLE (High Volume Partitioned / Indexed)
CREATE TABLE IF NOT EXISTS sensor_readings (
    reading_id BIGSERIAL PRIMARY KEY,
    device_id VARCHAR(64) NOT NULL REFERENCES sensor_devices(device_id) ON DELETE CASCADE,
    water_level_cm NUMERIC(8,2) NOT NULL,
    flow_rate_lps NUMERIC(10,2) DEFAULT 0.0,
    rainfall_mm_hr NUMERIC(8,2) DEFAULT 0.0,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    raw_payload JSONB
);

-- Partition / Index on (device_id, recorded_at DESC) for fast time-series queries
CREATE INDEX IF NOT EXISTS idx_sensor_readings_device_time ON sensor_readings (device_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_sensor_readings_recorded_at ON sensor_readings (recorded_at DESC);

-- 4. BLOCKAGE EVENTS TABLE
CREATE TABLE IF NOT EXISTS blockage_events (
    event_id VARCHAR(64) PRIMARY KEY,
    device_id VARCHAR(64) NOT NULL REFERENCES sensor_devices(device_id),
    drain_segment_id VARCHAR(64) REFERENCES drain_segments(segment_id),
    rule_triggered VARCHAR(64) NOT NULL CHECK (rule_triggered IN ('RISING_NO_OUTFLOW', 'STAGNANT_HIGH', 'FLOW_MISMATCH', 'RAPID_SURGE')),
    confidence_score INTEGER NOT NULL CHECK (confidence_score BETWEEN 0 AND 100),
    explanation TEXT NOT NULL,
    detected_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMPTZ,
    status VARCHAR(32) NOT NULL DEFAULT 'suspected' CHECK (status IN ('suspected', 'confirmed', 'clearing', 'resolved')),
    assigned_crew_id VARCHAR(64),
    verified_by VARCHAR(64),
    verification_notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_blockage_events_status ON blockage_events(status);
CREATE INDEX IF NOT EXISTS idx_blockage_events_detected ON blockage_events(detected_at DESC);

-- 5. SENSOR MAINTENANCE LOG TABLE
CREATE TABLE IF NOT EXISTS sensor_maintenance_log (
    id BIGSERIAL PRIMARY KEY,
    device_id VARCHAR(64) NOT NULL REFERENCES sensor_devices(device_id) ON DELETE CASCADE,
    action VARCHAR(255) NOT NULL,
    performed_by VARCHAR(128) NOT NULL,
    performed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_maintenance_log_device ON sensor_maintenance_log(device_id);
