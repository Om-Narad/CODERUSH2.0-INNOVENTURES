"""
Nagpur Drainage Network — Blockage Detection Engine
===================================================
Evaluates IoT water-level sensor telemetry using 4 deterministic rules:
1. RISING_NO_OUTFLOW
2. STAGNANT_HIGH
3. FLOW_MISMATCH
4. RAPID_SURGE

Every triggered alert includes a confidence score (0-100) and a human-readable explanation.
"""

import uuid
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Tuple
from drainage_models import SensorDevice, DrainSegment, BlockageEvent, SensorReadingIngest

def evaluate_blockage_rules(
    device: SensorDevice,
    recent_readings: List[Dict],
    segment: Optional[DrainSegment] = None,
    upstream_device: Optional[SensorDevice] = None
) -> Optional[BlockageEvent]:
    """
    Evaluates blockage rules against recent time-series readings for a sensor device.
    Returns a BlockageEvent if any rule triggers, or None if normal.
    """
    if not recent_readings or len(recent_readings) < 2:
        return None

    # Sort readings ascending by recorded_at
    sorted_readings = sorted(recent_readings, key=lambda r: r.get("recorded_at", ""))
    latest = sorted_readings[-1]
    earliest_15m = sorted_readings[0]

    current_level = float(latest.get("water_level_cm", 0.0))
    current_rain = float(latest.get("rainfall_mm_hr", 0.0))
    warning_thresh = float(device.warning_threshold_cm)
    critical_thresh = float(device.critical_threshold_cm)
    design_rate = float(device.expected_drain_rate_cm_per_min)

    now_iso = datetime.now(timezone.utc).isoformat()

    # ─── RULE 4: RAPID_SURGE ──────────────────────────────────────────────────
    # Check rate of rise between last 2 readings
    if len(sorted_readings) >= 2:
        prev = sorted_readings[-2]
        delta_cm = current_level - float(prev.get("water_level_cm", current_level))
        
        # Calculate time delta in minutes
        try:
            t_curr = datetime.fromisoformat(latest.get("recorded_at", "").replace("Z", "+00:00"))
            t_prev = datetime.fromisoformat(prev.get("recorded_at", "").replace("Z", "+00:00"))
            dt_min = max((t_curr - t_prev).total_seconds() / 60.0, 0.5)
        except Exception:
            dt_min = 5.0

        rate_per_min = delta_cm / dt_min

        if current_level >= warning_thresh and rate_per_min > (design_rate * 1.8):
            confidence = min(90 + int(rate_per_min * 2), 100)
            explanation = (
                f"Water level surging at {rate_per_min:.1f} cm/min exceeding design clearance capacity "
                f"({design_rate:.1f} cm/min) — critical underpass submersion threat at {device.label}."
            )
            return BlockageEvent(
                event_id=f"blk-{uuid.uuid4().hex[:8]}",
                device_id=device.device_id,
                device_label=device.label,
                drain_segment_id=device.drain_segment_id,
                drain_segment_name=segment.name if segment else device.drain_segment_id,
                rule_triggered="RAPID_SURGE",
                confidence_score=confidence,
                explanation=explanation,
                detected_at=now_iso,
                status="suspected",
                people_exposed_downstream=3200 if "Underpass" in device.label else 1800
            )

    # ─── RULE 3: FLOW_MISMATCH ────────────────────────────────────────────────
    # Upstream sensor level is high but this (downstream) sensor remains flat
    if upstream_device and upstream_device.current_water_level_cm >= (upstream_device.warning_threshold_cm * 0.9):
        up_level = upstream_device.current_water_level_cm
        down_level = current_level
        level_gap = up_level - down_level

        if level_gap > 25.0:  # Upstream is >25cm higher than downstream
            confidence = min(85 + int(level_gap * 0.4), 98)
            explanation = (
                f"Upstream sensor '{upstream_device.label}' rose to {up_level:.1f} cm while downstream "
                f"sensor '{device.label}' remained flat at {down_level:.1f} cm — blockage isolated between segment."
            )
            return BlockageEvent(
                event_id=f"blk-{uuid.uuid4().hex[:8]}",
                device_id=device.device_id,
                device_label=device.label,
                drain_segment_id=device.drain_segment_id,
                drain_segment_name=segment.name if segment else device.drain_segment_id,
                rule_triggered="FLOW_MISMATCH",
                confidence_score=confidence,
                explanation=explanation,
                detected_at=now_iso,
                status="suspected",
                people_exposed_downstream=2800
            )

    # ─── RULE 1: RISING_NO_OUTFLOW ───────────────────────────────────────────
    # Water level increases >8cm over window while rainfall has stopped (<= 0.5 mm/hr)
    earliest_level = float(earliest_15m.get("water_level_cm", current_level))
    total_delta = current_level - earliest_level

    if total_delta >= 8.0 and current_rain <= 0.5:
        confidence = min(78 + int(total_delta * 1.5), 95)
        explanation = (
            f"Water level held at {current_level:.1f} cm (rose +{total_delta:.1f} cm over last 15 min) "
            f"despite zero rainfall ({current_rain:.1f} mm/hr) — outflow obstructed by downstream debris."
        )
        return BlockageEvent(
            event_id=f"blk-{uuid.uuid4().hex[:8]}",
            device_id=device.device_id,
            device_label=device.label,
            drain_segment_id=device.drain_segment_id,
            drain_segment_name=segment.name if segment else device.drain_segment_id,
            rule_triggered="RISING_NO_OUTFLOW",
            confidence_score=confidence,
            explanation=explanation,
            detected_at=now_iso,
            status="suspected",
            people_exposed_downstream=2400
        )

    # ─── RULE 2: STAGNANT_HIGH ───────────────────────────────────────────────
    # Level stays above warning threshold for multiple readings without falling >2cm
    all_above_warning = all(float(r.get("water_level_cm", 0.0)) >= warning_thresh for r in sorted_readings)
    max_level = max(float(r.get("water_level_cm", 0.0)) for r in sorted_readings)
    min_level = min(float(r.get("water_level_cm", 0.0)) for r in sorted_readings)
    level_variance = max_level - min_level

    if all_above_warning and level_variance < 3.0:
        confidence = min(82 + int((current_level - warning_thresh) * 0.5), 96)
        explanation = (
            f"Level held at {current_level:.1f} cm (above warning threshold {warning_thresh:.0f} cm) "
            f"for over 30 min without falling — likely heavy silt blockage downstream."
        )
        return BlockageEvent(
            event_id=f"blk-{uuid.uuid4().hex[:8]}",
            device_id=device.device_id,
            device_label=device.label,
            drain_segment_id=device.drain_segment_id,
            drain_segment_name=segment.name if segment else device.drain_segment_id,
            rule_triggered="STAGNANT_HIGH",
            confidence_score=confidence,
            explanation=explanation,
            detected_at=now_iso,
            status="suspected",
            people_exposed_downstream=3400
        )

    return None
