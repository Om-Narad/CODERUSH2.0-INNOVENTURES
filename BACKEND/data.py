# Seed Data for SentinelPlan - Guwahati, Assam Flood Response Scenario

INITIAL_ZONES_DATA = [
    {
        "id": "zone-1",
        "name": "Guwahati North Lowlands (Sector 7)",
        "geometry": {
            "type": "Polygon",
            "coordinates": [
                [
                    [91.725, 26.195],
                    [91.732, 26.212],
                    [91.750, 26.208],
                    [91.745, 26.190],
                    [91.725, 26.195]
                ]
            ]
        },
        "people_exposed": 2400,
        "status": "pending",
        "assigned_squad": None,
        "assigned_shelter": "Saraighat Relief Center"
    },
    {
        "id": "zone-2",
        "name": "Brahmaputra River Basin East",
        "geometry": {
            "type": "Polygon",
            "coordinates": [
                [
                    [91.752, 26.182],
                    [91.758, 26.202],
                    [91.782, 26.192],
                    [91.775, 26.172],
                    [91.752, 26.182]
                ]
            ]
        },
        "people_exposed": 1600,
        "status": "pending",
        "assigned_squad": None,
        "assigned_shelter": "St. Jude High School"
    },
    {
        "id": "zone-3",
        "name": "Kamrup Central Transit Hub",
        "geometry": {
            "type": "Polygon",
            "coordinates": [
                [
                    [91.730, 26.155],
                    [91.735, 26.175],
                    [91.752, 26.170],
                    [91.745, 26.150],
                    [91.730, 26.155]
                ]
            ]
        },
        "people_exposed": 1100,
        "status": "pending",
        "assigned_squad": None,
        "assigned_shelter": "Guwahati Stadium Complex"
    },
    {
        "id": "zone-4",
        "name": "Kaziranga Foothills Reserve",
        "geometry": {
            "type": "Polygon",
            "coordinates": [
                [
                    [91.702, 26.202],
                    [91.710, 26.222],
                    [91.728, 26.212],
                    [91.718, 26.195],
                    [91.702, 26.202]
                ]
            ]
        },
        "people_exposed": 700,
        "status": "pending",
        "assigned_squad": None,
        "assigned_shelter": "Civic Hospital Shelter"
    }
]

INITIAL_ROADS_DATA = [
    {
        "id": "road-1",
        "name": "NH-27 Brahmaputra Arterial Highway",
        "status": "open",
        "connects_zone_ids": ["zone-1", "zone-3"],
        "geometry": {
            "type": "LineString",
            "coordinates": [
                [91.748, 26.155],
                [91.745, 26.165],
                [91.742, 26.185],
                [91.738, 26.202]
            ]
        }
    },
    {
        "id": "road-2",
        "name": "Saraighat River Bridge Expressway",
        "status": "open",
        "connects_zone_ids": ["zone-1", "zone-2"],
        "geometry": {
            "type": "LineString",
            "coordinates": [
                [91.738, 26.202],
                [91.752, 26.198],
                [91.765, 26.195]
            ]
        }
    },
    {
        "id": "road-3",
        "name": "East Guwahati Bypass Corridor",
        "status": "open",
        "connects_zone_ids": ["zone-2"],
        "geometry": {
            "type": "LineString",
            "coordinates": [
                [91.765, 26.195],
                [91.778, 26.182],
                [91.785, 26.170]
            ]
        }
    },
    {
        "id": "road-4",
        "name": "Metro Central Link",
        "status": "open",
        "connects_zone_ids": ["zone-2"],
        "geometry": {
            "type": "LineString",
            "coordinates": [
                [91.745, 26.165],
                [91.758, 26.175],
                [91.765, 26.195]
            ]
        }
    },
    {
        "id": "road-5",
        "name": "South Bank Emergency Pass",
        "status": "open",
        "connects_zone_ids": ["zone-3"],
        "geometry": {
            "type": "LineString",
            "coordinates": [
                [91.740, 26.148],
                [91.742, 26.158],
                [91.745, 26.165]
            ]
        }
    },
    {
        "id": "road-6",
        "name": "West Guwahati Feeder",
        "status": "open",
        "connects_zone_ids": ["zone-3", "zone-4"],
        "geometry": {
            "type": "LineString",
            "coordinates": [
                [91.745, 26.165],
                [91.728, 26.185],
                [91.715, 26.210]
            ]
        }
    },
    {
        "id": "road-7",
        "name": "Kaziranga Reserve Pass",
        "status": "open",
        "connects_zone_ids": ["zone-4"],
        "geometry": {
            "type": "LineString",
            "coordinates": [
                [91.715, 26.210],
                [91.705, 26.225],
                [91.698, 26.238]
            ]
        }
    }
]

INITIAL_STATS_DATA = {
    "responders_deployed": 12,
    "responders_available": 20,
    "shelters_at_capacity": 2,
    "shelters_total": 5
}

INITIAL_ALERTS_DATA = [
    {
        "id": "alert-1",
        "timestamp": "2026-08-07T14:28:10Z",
        "message": "System Initialized — Brahmaputra flood telemetry active across Assam sectors."
    },
    {
        "id": "alert-2",
        "timestamp": "2026-08-07T14:30:45Z",
        "message": "River Level Gauge — Saraighat station measured +1.8m surge above danger mark."
    },
    {
        "id": "alert-3",
        "timestamp": "2026-08-07T14:32:00Z",
        "message": "CRITICAL — Guwahati North Sector 7 flood inundation priority evaluated to 84 (Critical)."
    }
]
