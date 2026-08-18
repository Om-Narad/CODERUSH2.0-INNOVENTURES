# Seed Data for Nagpur Flood Safe - Backend API
# Focused exclusively on Nagpur City, Maharashtra, India

INITIAL_ZONES_DATA = [
    {
        "id": "zone-1",
        "name": "Manish Nagar Underpass & Rail Belt",
        "geometry": {
            "type": "Polygon",
            "coordinates": [
                [
                    [79.068, 21.098],
                    [79.078, 21.110],
                    [79.088, 21.102],
                    [79.075, 21.092],
                    [79.068, 21.098]
                ]
            ]
        },
        "people_exposed": 3400,
        "houses_exposed": 680,
        "status": "assigned",
        "assigned_squad": "Squad Delta-1 (Underpass Rescue)",
        "assigned_shelter": "Ambazari Municipal Relief Center"
    },
    {
        "id": "zone-2",
        "name": "Narendra Nagar, Beltarodi & Besa Basin",
        "geometry": {
            "type": "Polygon",
            "coordinates": [
                [
                    [79.078, 21.112],
                    [79.092, 21.122],
                    [79.102, 21.110],
                    [79.088, 21.100],
                    [79.078, 21.112]
                ]
            ]
        },
        "people_exposed": 2900,
        "houses_exposed": 580,
        "status": "assigned",
        "assigned_squad": "Squad Bravo-3 (NMC Quick Response)",
        "assigned_shelter": "Mankapur Indoor Sports Complex"
    },
    {
        "id": "zone-3",
        "name": "Ambazari Spillway & Friends Colony",
        "geometry": {
            "type": "Polygon",
            "coordinates": [
                [
                    [79.038, 21.126],
                    [79.048, 21.142],
                    [79.062, 21.135],
                    [79.052, 21.118],
                    [79.038, 21.126]
                ]
            ]
        },
        "people_exposed": 4200,
        "houses_exposed": 840,
        "status": "assigned",
        "assigned_squad": "Alpha Tactical Flood Unit",
        "assigned_shelter": "Sitabuldi Civic Relief Hub"
    },
    {
        "id": "zone-4",
        "name": "Pratap Nagar & Somalwar School Area",
        "geometry": {
            "type": "Polygon",
            "coordinates": [
                [
                    [79.055, 21.115],
                    [79.068, 21.128],
                    [79.078, 21.118],
                    [79.065, 21.106],
                    [79.055, 21.115]
                ]
            ]
        },
        "people_exposed": 2100,
        "houses_exposed": 420,
        "status": "pending",
        "assigned_squad": None,
        "assigned_shelter": "Resimbagh Ground Evacuation Center"
    },
    {
        "id": "zone-5",
        "name": "Gorewada Nullah (Zingabai Takli & Mankapur)",
        "geometry": {
            "type": "Polygon",
            "coordinates": [
                [
                    [79.052, 21.172],
                    [79.065, 21.190],
                    [79.082, 21.182],
                    [79.070, 21.165],
                    [79.052, 21.172]
                ]
            ]
        },
        "people_exposed": 3100,
        "houses_exposed": 620,
        "status": "pending",
        "assigned_squad": None,
        "assigned_shelter": "Mankapur Indoor Sports Complex"
    },
    {
        "id": "zone-6",
        "name": "Wardha Road Highway & MIHAN Feeder",
        "geometry": {
            "type": "Polygon",
            "coordinates": [
                [
                    [79.042, 21.075],
                    [79.058, 21.092],
                    [79.070, 21.082],
                    [79.054, 21.066],
                    [79.042, 21.075]
                ]
            ]
        },
        "people_exposed": 1600,
        "houses_exposed": 320,
        "status": "assigned",
        "assigned_squad": "MIHAN Emergency Response Team",
        "assigned_shelter": "MIHAN Emergency Service Center"
    }
]

INITIAL_ROADS_DATA = [
    {
        "id": "road-1",
        "name": "Manish Nagar Railway Underpass Corridor",
        "status": "blocked",
        "connects_zone_ids": ["zone-1", "zone-4"],
        "geometry": {
            "type": "LineString",
            "coordinates": [
                [79.068, 21.098],
                [79.075, 21.105],
                [79.082, 21.110]
            ]
        }
    },
    {
        "id": "road-2",
        "name": "Narendra Nagar Flyover & Arterial Belt",
        "status": "blocked",
        "connects_zone_ids": ["zone-2", "zone-1"],
        "geometry": {
            "type": "LineString",
            "coordinates": [
                [79.078, 21.112],
                [79.088, 21.120],
                [79.095, 21.125]
            ]
        }
    },
    {
        "id": "road-3",
        "name": "Wardha Road Highway (NH-44 / Airport Corridor)",
        "status": "open",
        "connects_zone_ids": ["zone-1", "zone-6"],
        "geometry": {
            "type": "LineString",
            "coordinates": [
                [79.042, 21.075],
                [79.058, 21.095],
                [79.070, 21.125],
                [79.080, 21.145]
            ]
        }
    },
    {
        "id": "road-4",
        "name": "Ambazari Ring Road & Laxmi Nagar Bypass",
        "status": "open",
        "connects_zone_ids": ["zone-3", "zone-4"],
        "geometry": {
            "type": "LineString",
            "coordinates": [
                [79.038, 21.126],
                [79.052, 21.135],
                [79.065, 21.142]
            ]
        }
    },
    {
        "id": "road-5",
        "name": "Gorewada Nullah Mankapur Bridge (NH-53)",
        "status": "open",
        "connects_zone_ids": ["zone-5"],
        "geometry": {
            "type": "LineString",
            "coordinates": [
                [79.052, 21.172],
                [79.068, 21.182],
                [79.082, 21.190]
            ]
        }
    },
    {
        "id": "road-6",
        "name": "Hingna Road - MIHAN Connector Link",
        "status": "open",
        "connects_zone_ids": ["zone-6", "zone-2"],
        "geometry": {
            "type": "LineString",
            "coordinates": [
                [79.042, 21.075],
                [79.058, 21.090],
                [79.075, 21.105]
            ]
        }
    },
    {
        "id": "road-7",
        "name": "Pratap Nagar Somalwar School Radial Road",
        "status": "open",
        "connects_zone_ids": ["zone-4", "zone-3"],
        "geometry": {
            "type": "LineString",
            "coordinates": [
                [79.055, 21.115],
                [79.068, 21.128],
                [79.075, 21.138]
            ]
        }
    }
]

INITIAL_STATS_DATA = {
    "responders_deployed": 18,
    "responders_available": 24,
    "shelters_at_capacity": 3,
    "shelters_total": 6
}

INITIAL_ALERTS_DATA = [
    {
        "id": "alert-1",
        "timestamp": "2026-07-29T08:15:00Z",
        "message": "🚨 NAGPUR FLOOD ALERT — Torrential monsoon downpour (140mm in 6h) triggering waterlogging in Manish Nagar Underpass & Beltarodi."
    },
    {
        "id": "alert-2",
        "timestamp": "2026-07-29T09:30:00Z",
        "message": "⚠️ NAG RIVER TELEMETRY — Sitabuldi gauge station recorded +1.8m surge above danger mark."
    },
    {
        "id": "alert-3",
        "timestamp": "2026-07-29T10:45:00Z",
        "message": "🌊 GOREWADA SPILLWAY — Overflow canal submerging Mankapur & Zingabai Takli lowlands. Emergency evacuation active."
    }
]
