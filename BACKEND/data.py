# Seed Data for SentinelPlan - Nagpur, Maharashtra Flood Response Scenario

INITIAL_ZONES_DATA = [
    {
        "id": "zone-1",
        "name": "Ambazari & Subhash Nagar Lowlands",
        "geometry": {
            "type": "Polygon",
            "coordinates": [
                [
                    [79.035, 21.125],
                    [79.042, 21.142],
                    [79.060, 21.138],
                    [79.052, 21.120],
                    [79.035, 21.125]
                ]
            ]
        },
        "people_exposed": 3200,
        "houses_exposed": 640,
        "status": "pending",
        "assigned_squad": None,
        "assigned_shelter": "Ambazari Relief Center"
    },
    {
        "id": "zone-2",
        "name": "Nag River Central Corridor (Sitabuldi)",
        "geometry": {
            "type": "Polygon",
            "coordinates": [
                [
                    [79.075, 21.145],
                    [79.082, 21.162],
                    [79.100, 21.155],
                    [79.092, 21.138],
                    [79.075, 21.145]
                ]
            ]
        },
        "people_exposed": 2400,
        "houses_exposed": 480,
        "status": "pending",
        "assigned_squad": None,
        "assigned_shelter": "Mankapur Sports Complex"
    },
    {
        "id": "zone-3",
        "name": "Pili River North Basin (Kalamna)",
        "geometry": {
            "type": "Polygon",
            "coordinates": [
                [
                    [79.100, 21.175],
                    [79.108, 21.192],
                    [79.125, 21.188],
                    [79.118, 21.168],
                    [79.100, 21.175]
                ]
            ]
        },
        "people_exposed": 1800,
        "houses_exposed": 360,
        "status": "pending",
        "assigned_squad": None,
        "assigned_shelter": "Resimbagh Civic Center"
    },
    {
        "id": "zone-4",
        "name": "Gorewada Catchment & Wardha Road Link",
        "geometry": {
            "type": "Polygon",
            "coordinates": [
                [
                    [79.040, 21.100],
                    [79.048, 21.118],
                    [79.065, 21.112],
                    [79.058, 21.095],
                    [79.040, 21.100]
                ]
            ]
        },
        "people_exposed": 950,
        "houses_exposed": 190,
        "status": "pending",
        "assigned_squad": None,
        "assigned_shelter": "Sitabuldi Community Shelter"
    }
]

INITIAL_ROADS_DATA = [
    {
        "id": "road-1",
        "name": "Wardha Road Highway Corridor (NH-44)",
        "status": "open",
        "connects_zone_ids": ["zone-1", "zone-4"],
        "geometry": {
            "type": "LineString",
            "coordinates": [
                [79.055, 21.090],
                [79.060, 21.115],
                [79.065, 21.135],
                [79.075, 21.150]
            ]
        }
    },
    {
        "id": "road-2",
        "name": "Ambazari Lake Spillway Expressway",
        "status": "open",
        "connects_zone_ids": ["zone-1", "zone-2"],
        "geometry": {
            "type": "LineString",
            "coordinates": [
                [79.045, 21.130],
                [79.060, 21.140],
                [79.075, 21.148]
            ]
        }
    },
    {
        "id": "road-3",
        "name": "Nag River Urban Bypass Corridor",
        "status": "open",
        "connects_zone_ids": ["zone-2"],
        "geometry": {
            "type": "LineString",
            "coordinates": [
                [79.075, 21.148],
                [79.090, 21.155],
                [79.105, 21.165]
            ]
        }
    },
    {
        "id": "road-4",
        "name": "Sitabuldi Central Metro Arterial",
        "status": "open",
        "connects_zone_ids": ["zone-2"],
        "geometry": {
            "type": "LineString",
            "coordinates": [
                [79.065, 21.135],
                [79.080, 21.145],
                [79.090, 21.155]
            ]
        }
    },
    {
        "id": "road-5",
        "name": "Kamptee Highway Emergency Pass (NH-53)",
        "status": "open",
        "connects_zone_ids": ["zone-3"],
        "geometry": {
            "type": "LineString",
            "coordinates": [
                [79.105, 21.165],
                [79.115, 21.180],
                [79.130, 21.195]
            ]
        }
    },
    {
        "id": "road-6",
        "name": "Hingna Ring Road Feeder",
        "status": "open",
        "connects_zone_ids": ["zone-1", "zone-4"],
        "geometry": {
            "type": "LineString",
            "coordinates": [
                [79.025, 21.110],
                [79.040, 21.125],
                [79.055, 21.135]
            ]
        }
    },
    {
        "id": "road-7",
        "name": "Gorewada Dam Bypass Pass",
        "status": "open",
        "connects_zone_ids": ["zone-4"],
        "geometry": {
            "type": "LineString",
            "coordinates": [
                [79.030, 21.170],
                [79.045, 21.185],
                [79.055, 21.195]
            ]
        }
    }
]

INITIAL_STATS_DATA = {
    "responders_deployed": 14,
    "responders_available": 22,
    "shelters_at_capacity": 2,
    "shelters_total": 5
}

INITIAL_ALERTS_DATA = [
    {
        "id": "alert-1",
        "timestamp": "2026-08-14T14:28:10Z",
        "message": "System Initialized — Nagpur Municipal Corporation (NMC) Flood Telemetry active."
    },
    {
        "id": "alert-2",
        "timestamp": "2026-08-14T14:30:45Z",
        "message": "Nag River Level Alert — Sitabuldi gauge station recorded +1.6m surge above danger level."
    },
    {
        "id": "alert-3",
        "timestamp": "2026-08-14T14:32:00Z",
        "message": "CRITICAL WARNING — Ambazari & Subhash Nagar Lowlands flood priority elevated to 85 (RED)."
    }
]
