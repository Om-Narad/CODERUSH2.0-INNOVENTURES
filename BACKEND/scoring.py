from typing import List

def calculate_priority(zone, roads: List) -> int:
    """
    Calculates priority score for a zone based on exposed population
    and the status of connected evacuation roads.
    Target base scores when all roads open:
      - Zone 1 (2400 pop) ~ 84 (Critical, >=75)
      - Zone 2 (1600 pop) ~ 62 (Warning, 50-74)
      - Zone 3 (1100 pop) ~ 41 (Stable, <50)
      - Zone 4 (700 pop)  ~ 26 (Stable)
    """
    connected = [r for r in roads if zone.id in r.connects_zone_ids]
    if not connected:
        return 50

    total_count = len(connected)
    open_count = len([r for r in connected if r.status == "open"])
    access_ratio = open_count / total_count

    # Base priority mapping or population formula
    if zone.people_exposed >= 2000:
        base_score = 84
    elif zone.people_exposed >= 1500:
        base_score = 62
    elif zone.people_exposed >= 1000:
        base_score = 41
    else:
        base_score = 26

    # Penalty for blocked roads
    blocked_count = total_count - open_count
    blocked_penalty = round(blocked_count * 15)

    if open_count == 0:
        score = 98
    else:
        score = base_score + blocked_penalty

    return min(max(score, 10), 100)


def generate_rationale(zone, roads: List) -> str:
    """
    Generates human-readable AI rationale based on road access ratio.
    """
    connected = [r for r in roads if zone.id in r.connects_zone_ids]
    if not connected:
        return "No evacuation routes assigned."

    total_count = len(connected)
    open_count = len([r for r in connected if r.status == "open"])

    if open_count == 0:
        return f"CRITICAL ISOLATION — 0 of {total_count} routes remain open. Emergency airlift required."
    elif open_count == 1 and total_count > 1:
        return f"CRITICAL — Evacuation bottleneck: only {open_count}/{total_count} routes remain open."
    elif open_count < total_count:
        return f"WARNING — {total_count - open_count} route(s) compromised ({open_count}/{total_count} open)."
    else:
        return f"Normal evacuation route access ({open_count}/{total_count} open). Stable."
