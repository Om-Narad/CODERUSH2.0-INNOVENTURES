"""
SentinelPlan Multi-Region Data & Telemetry Module
=================================================
Provides region-agnostic disaster datasets (Assam, Bangladesh, Spain, Brazil, USA, Global)
and fetches real-time GDACS live flood event telemetry.
"""

import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
import json

REGIONS_METADATA = [
    {
        "id": "nagpur",
        "name": "Nagpur Flood Command Center",
        "country": "India",
        "center": [21.1458, 79.0882],
        "zoom": 12,
        "hazard_level": "Critical",
        "description": "Monsoon Nag River & Pili River overflow affecting Ambazari Lowlands and Sitabuldi transit corridors.",
        "alert_count": 3
    },
    {
        "id": "bangladesh",
        "name": "Sylhet & Surma River Basin",
        "country": "Bangladesh",
        "center": [24.894, 91.868],
        "zoom": 12,
        "hazard_level": "Critical",
        "description": "Flash flooding in Surma & Kushiyara river basins threatening low-lying urban wards and transit arteries.",
        "alert_count": 4
    },
    {
        "id": "spain",
        "name": "Valencia & Turia River Basin",
        "country": "Spain",
        "center": [39.469, -0.376],
        "zoom": 12,
        "hazard_level": "High",
        "description": "Extreme DANA torrential rainfall & Flash Floods across Turia basin and coastal Valencia bypass links.",
        "alert_count": 3
    },
    {
        "id": "brazil",
        "name": "Rio Grande do Sul & Jacuí Basin",
        "country": "Brazil",
        "center": [-30.034, -51.217],
        "zoom": 12,
        "hazard_level": "Critical",
        "description": "Severe inundation around Guaíba Lake & Porto Alegre metropolitan emergency evacuation zones.",
        "alert_count": 5
    },
    {
        "id": "usa",
        "name": "Kentucky & Mississippi Basin",
        "country": "USA",
        "center": [37.368, -83.196],
        "zoom": 11,
        "hazard_level": "Moderate",
        "description": "Eastern Kentucky mountain flash floods & Appalachian river basin overflow.",
        "alert_count": 2
    },
    {
        "id": "global",
        "name": "Global Overview (Active Flood Disasters)",
        "country": "Worldwide",
        "center": [20.0, 10.0],
        "zoom": 3,
        "hazard_level": "Global Watch",
        "description": "Satellite-based real-time global flood overview tracking GDACS active disaster alerts & high-risk zones.",
        "alert_count": 8
    }
]

# ─── REGION DATASETS ─────────────────────────────────────────────────────────

MULTI_REGION_DATA = {
    "nagpur": {
        "zones": [
            {
                "id": "zone-1",
                "name": "Ambazari & Subhash Nagar Lowlands",
                "geometry": {"type": "Polygon", "coordinates": [[[79.035, 21.125], [79.042, 21.142], [79.060, 21.138], [79.052, 21.120], [79.035, 21.125]]]},
                "people_exposed": 3200,
                "houses_exposed": 640,
                "status": "pending",
                "assigned_squad": None,
                "assigned_shelter": "Ambazari Relief Center"
            },
            {
                "id": "zone-2",
                "name": "Nag River Central Corridor (Sitabuldi)",
                "geometry": {"type": "Polygon", "coordinates": [[[79.075, 21.145], [79.082, 21.162], [79.100, 21.155], [79.092, 21.138], [79.075, 21.145]]]},
                "people_exposed": 2400,
                "houses_exposed": 480,
                "status": "pending",
                "assigned_squad": None,
                "assigned_shelter": "Mankapur Sports Complex"
            },
            {
                "id": "zone-3",
                "name": "Pili River North Basin (Kalamna)",
                "geometry": {"type": "Polygon", "coordinates": [[[79.100, 21.175], [79.108, 21.192], [79.125, 21.188], [79.118, 21.168], [79.100, 21.175]]]},
                "people_exposed": 1800,
                "houses_exposed": 360,
                "status": "pending",
                "assigned_squad": None,
                "assigned_shelter": "Resimbagh Civic Center"
            },
            {
                "id": "zone-4",
                "name": "Gorewada Catchment & Wardha Road Link",
                "geometry": {"type": "Polygon", "coordinates": [[[79.040, 21.100], [79.048, 21.118], [79.065, 21.112], [79.058, 21.095], [79.040, 21.100]]]},
                "people_exposed": 950,
                "houses_exposed": 190,
                "status": "pending",
                "assigned_squad": None,
                "assigned_shelter": "Sitabuldi Community Shelter"
            }
        ],
        "roads": [
            {"id": "road-1", "name": "Wardha Road Highway Corridor (NH-44)", "status": "open", "connects_zone_ids": ["zone-1", "zone-4"], "geometry": {"type": "LineString", "coordinates": [[79.055, 21.090], [79.060, 21.115], [79.065, 21.135], [79.075, 21.150]]}},
            {"id": "road-2", "name": "Ambazari Lake Spillway Expressway", "status": "open", "connects_zone_ids": ["zone-1", "zone-2"], "geometry": {"type": "LineString", "coordinates": [[79.045, 21.130], [79.060, 21.140], [79.075, 21.148]]}},
            {"id": "road-3", "name": "Nag River Urban Bypass Corridor", "status": "open", "connects_zone_ids": ["zone-2"], "geometry": {"type": "LineString", "coordinates": [[79.075, 21.148], [79.090, 21.155], [79.105, 21.165]]}},
            {"id": "road-4", "name": "Sitabuldi Central Metro Arterial", "status": "open", "connects_zone_ids": ["zone-2"], "geometry": {"type": "LineString", "coordinates": [[79.065, 21.135], [79.080, 21.145], [79.090, 21.155]]}},
            {"id": "road-5", "name": "Kamptee Highway Emergency Pass (NH-53)", "status": "open", "connects_zone_ids": ["zone-3"], "geometry": {"type": "LineString", "coordinates": [[79.105, 21.165], [79.115, 21.180], [79.130, 21.195]]}},
            {"id": "road-6", "name": "Hingna Ring Road Feeder", "status": "open", "connects_zone_ids": ["zone-1", "zone-4"], "geometry": {"type": "LineString", "coordinates": [[79.025, 21.110], [79.040, 21.125], [79.055, 21.135]]}},
            {"id": "road-7", "name": "Gorewada Dam Bypass Pass", "status": "open", "connects_zone_ids": ["zone-4"], "geometry": {"type": "LineString", "coordinates": [[79.030, 21.170], [79.045, 21.185], [79.055, 21.195]]}}
        ],
        "stats": {"responders_deployed": 14, "responders_available": 22, "shelters_at_capacity": 2, "shelters_total": 5},
        "alerts": [
            {"id": "alert-a1", "timestamp": "2026-08-14T14:28:10Z", "message": "Nagpur Telemetry Active — Nag River & Pili River flood monitoring online across NMC sectors."},
            {"id": "alert-a2", "timestamp": "2026-08-14T14:30:45Z", "message": "Sitabuldi Gauge Station — Surge measured +1.6m above danger level."},
            {"id": "alert-a3", "timestamp": "2026-08-14T14:32:00Z", "message": "CRITICAL — Ambazari & Subhash Nagar Lowlands inundation priority score evaluated to 85 (Critical)."}
        ]
    },
    "bangladesh": {
        "zones": [
            {
                "id": "zone-b1",
                "name": "Sylhet Sadar Lowlands",
                "geometry": {"type": "Polygon", "coordinates": [[[91.850, 24.885], [91.860, 24.905], [91.880, 24.898], [91.870, 24.880], [91.850, 24.885]]]},
                "people_exposed": 3800,
                "status": "pending",
                "assigned_squad": None,
                "assigned_shelter": "Sylhet Government College Shelter"
            },
            {
                "id": "zone-b2",
                "name": "Surma River Floodplain Sector",
                "geometry": {"type": "Polygon", "coordinates": [[[91.872, 24.870], [91.882, 24.890], [91.902, 24.882], [91.895, 24.862], [91.872, 24.870]]]},
                "people_exposed": 2900,
                "status": "pending",
                "assigned_squad": None,
                "assigned_shelter": "Shahjalal University Relief Hub"
            },
            {
                "id": "zone-b3",
                "name": "Kushiyara Basin Transit Corridor",
                "geometry": {"type": "Polygon", "coordinates": [[[91.835, 24.860], [91.848, 24.878], [91.865, 24.870], [91.852, 24.852], [91.835, 24.860]]]},
                "people_exposed": 1800,
                "status": "pending",
                "assigned_squad": None,
                "assigned_shelter": "East Sylhet Civic Center"
            }
        ],
        "roads": [
            {"id": "road-b1", "name": "N2 Dhaka-Sylhet National Highway", "status": "open", "connects_zone_ids": ["zone-b1", "zone-b3"], "geometry": {"type": "LineString", "coordinates": [[91.840, 24.855], [91.855, 24.875], [91.865, 24.890]]}},
            {"id": "road-b2", "name": "Surma Bridge Bypass", "status": "open", "connects_zone_ids": ["zone-b1", "zone-b2"], "geometry": {"type": "LineString", "coordinates": [[91.865, 24.890], [91.880, 24.885], [91.895, 24.875]]}},
            {"id": "road-b3", "name": "Kushiyara Embankment Road", "status": "open", "connects_zone_ids": ["zone-b2", "zone-b3"], "geometry": {"type": "LineString", "coordinates": [[91.852, 24.852], [91.875, 24.865], [91.895, 24.875]]}}
        ],
        "stats": {"responders_deployed": 18, "responders_available": 25, "shelters_at_capacity": 3, "shelters_total": 8},
        "alerts": [
            {"id": "alert-b1", "timestamp": "2026-08-07T15:10:00Z", "message": "Sylhet Flash Flood Alert — Surma River discharge reached peak monsoon flood stage."},
            {"id": "alert-b2", "timestamp": "2026-08-07T15:15:20Z", "message": "N2 Highway Telemetry — Waterlogging detected along Surma Bridge approach ramps."}
        ]
    },
    "spain": {
        "zones": [
            {
                "id": "zone-s1",
                "name": "Turia River Inundation Sector (Paiporta)",
                "geometry": {"type": "Polygon", "coordinates": [[[-0.415, 39.430], [-0.405, 39.450], [-0.385, 39.442], [-0.395, 39.422], [-0.415, 39.430]]]},
                "people_exposed": 4200,
                "status": "pending",
                "assigned_squad": None,
                "assigned_shelter": "Polideportivo Municipal Paiporta"
            },
            {
                "id": "zone-s2",
                "name": "Valencia South Coastal Plain",
                "geometry": {"type": "Polygon", "coordinates": [[[-0.380, 39.445], [-0.370, 39.465], [-0.350, 39.458], [-0.360, 39.438], [-0.380, 39.445]]]},
                "people_exposed": 3100,
                "status": "pending",
                "assigned_squad": None,
                "assigned_shelter": "Feria Valencia Emergency Complex"
            }
        ],
        "roads": [
            {"id": "road-s1", "name": "V-30 Turia Bypass Highway", "status": "open", "connects_zone_ids": ["zone-s1", "zone-s2"], "geometry": {"type": "LineString", "coordinates": [[-0.405, 39.435], [-0.385, 39.445], [-0.365, 39.455]]}},
            {"id": "road-s2", "name": "AP-7 Autopista del Mediterráneo", "status": "open", "connects_zone_ids": ["zone-s1"], "geometry": {"type": "LineString", "coordinates": [[-0.420, 39.425], [-0.410, 39.440], [-0.400, 39.460]]}}
        ],
        "stats": {"responders_deployed": 24, "responders_available": 30, "shelters_at_capacity": 4, "shelters_total": 9},
        "alerts": [
            {"id": "alert-s1", "timestamp": "2026-08-07T16:00:00Z", "message": "Valencia DANA Emergency — Extreme flash flood torrents overflowing Turia river channel."},
            {"id": "alert-s2", "timestamp": "2026-08-07T16:05:00Z", "message": "V-30 Highway — High water level warning near Paiporta junction."}
        ]
    },
    "brazil": {
        "zones": [
            {
                "id": "zone-br1",
                "name": "Porto Alegre Guaíba Basin",
                "geometry": {"type": "Polygon", "coordinates": [[[-51.240, -30.045], [-51.230, -30.025], [-51.200, -30.030], [-51.210, -30.055], [-51.240, -30.045]]]},
                "people_exposed": 5100,
                "status": "pending",
                "assigned_squad": None,
                "assigned_shelter": "Arena do Grêmio Evacuation Center"
            },
            {
                "id": "zone-br2",
                "name": "Canoas Emergency Flood District",
                "geometry": {"type": "Polygon", "coordinates": [[[-51.210, -29.990], [-51.195, -29.970], [-51.170, -29.980], [-51.185, -30.000], [-51.210, -29.990]]]},
                "people_exposed": 3900,
                "status": "pending",
                "assigned_squad": None,
                "assigned_shelter": "ULBRA Campus Relief Shelter"
            }
        ],
        "roads": [
            {"id": "road-br1", "name": "BR-116 Guaíba Bridge Expressway", "status": "open", "connects_zone_ids": ["zone-br1", "zone-br2"], "geometry": {"type": "LineString", "coordinates": [[-51.220, -30.035], [-51.205, -30.010], [-51.190, -29.985]]}},
            {"id": "road-br2", "name": "Freeway BR-290 Corridor", "status": "open", "connects_zone_ids": ["zone-br1"], "geometry": {"type": "LineString", "coordinates": [[-51.240, -30.040], [-51.215, -30.045], [-51.180, -30.050]]}}
        ],
        "stats": {"responders_deployed": 35, "responders_available": 15, "shelters_at_capacity": 6, "shelters_total": 10},
        "alerts": [
            {"id": "alert-br1", "timestamp": "2026-08-07T16:20:00Z", "message": "Rio Grande do Sul Crisis — Guaíba water level peaked at historic 5.35m mark."},
            {"id": "alert-br2", "timestamp": "2026-08-07T16:25:00Z", "message": "BR-116 Corridor Telemetry — Inundation risk critical near Porto Alegre northern access."}
        ]
    },
    "usa": {
        "zones": [
            {
                "id": "zone-u1",
                "name": "Troublesome Creek Flood Sector",
                "geometry": {"type": "Polygon", "coordinates": [[[-83.220, 37.360], [-83.210, 37.380], [-83.185, 37.375], [-83.195, 37.355], [-83.220, 37.360]]]},
                "people_exposed": 1200,
                "status": "pending",
                "assigned_squad": None,
                "assigned_shelter": "Hazard High School Shelter"
            },
            {
                "id": "zone-u2",
                "name": "North Fork Kentucky River Basin",
                "geometry": {"type": "Polygon", "coordinates": [[[-83.180, 37.350], [-83.170, 37.370], [-83.145, 37.365], [-83.155, 37.345], [-83.180, 37.350]]]},
                "people_exposed": 950,
                "status": "pending",
                "assigned_squad": None,
                "assigned_shelter": "Perry County Community Hub"
            }
        ],
        "roads": [
            {"id": "road-u1", "name": "KY-15 Mountain Parkway Link", "status": "open", "connects_zone_ids": ["zone-u1", "zone-u2"], "geometry": {"type": "LineString", "coordinates": [[-83.215, 37.365], [-83.195, 37.360], [-83.165, 37.355]]}}
        ],
        "stats": {"responders_deployed": 10, "responders_available": 18, "shelters_at_capacity": 1, "shelters_total": 4},
        "alerts": [
            {"id": "alert-u1", "timestamp": "2026-08-07T16:30:00Z", "message": "Appalachian Flash Flood Warning — Heavy torrential downpour causing Troublesome Creek surge."}
        ]
    },
    "global": {
        "zones": [
            {
                "id": "zone-g1",
                "name": "South Asia Monsoon Flood Zone (Nag River/Surma)",
                "geometry": {"type": "Polygon", "coordinates": [[[88.0, 24.0], [92.0, 27.0], [95.0, 26.0], [91.0, 23.0], [88.0, 24.0]]]},
                "people_exposed": 125000,
                "status": "pending",
                "assigned_squad": None,
                "assigned_shelter": "Regional Disaster Response Command"
            },
            {
                "id": "zone-g2",
                "name": "Western Mediterranean Coastal Surge (Valencia Spain)",
                "geometry": {"type": "Polygon", "coordinates": [[[-1.5, 38.5], [-0.1, 40.5], [0.5, 39.8], [-0.8, 38.0], [-1.5, 38.5]]]},
                "people_exposed": 68000,
                "status": "pending",
                "assigned_squad": None,
                "assigned_shelter": "European Union Civil Protection Hub"
            },
            {
                "id": "zone-g3",
                "name": "South America Guaíba Basin Inundation (Brazil)",
                "geometry": {"type": "Polygon", "coordinates": [[[-53.0, -31.5], [-50.5, -29.0], [-49.8, -30.0], [-52.0, -32.0], [-53.0, -31.5]]]},
                "people_exposed": 94000,
                "status": "pending",
                "assigned_squad": None,
                "assigned_shelter": "Mercosur Emergency Taskforce"
            }
        ],
        "roads": [
            {"id": "road-g1", "name": "Global Maritime & Trans-Asian Corridor", "status": "open", "connects_zone_ids": ["zone-g1"], "geometry": {"type": "LineString", "coordinates": [[88.5, 24.5], [91.5, 26.0], [94.0, 25.5]]}},
            {"id": "road-g2", "name": "Trans-European Mediterranean Arterial", "status": "open", "connects_zone_ids": ["zone-g2"], "geometry": {"type": "LineString", "coordinates": [[-1.2, 38.8], [-0.4, 39.6], [0.2, 40.1]]}}
        ],
        "stats": {"responders_deployed": 110, "responders_available": 140, "shelters_at_capacity": 16, "shelters_total": 45},
        "alerts": [
            {"id": "alert-g1", "timestamp": "2026-08-07T17:00:00Z", "message": "GDACS Global Telemetry — Active Flood Alerts detected in 8 major international basins."},
            {"id": "alert-g2", "timestamp": "2026-08-07T17:05:00Z", "message": "Satellite Flood Extent — High-resolution Sentinel-1 synthetic aperture radar imagery updating active flood extent maps."}
        ]
    }
}


def fetch_gdacs_live_flood_alerts():
    """
    Fetches real-time flood alerts from GDACS (Global Disaster Alert and Coordination System) RSS feed.
    Returns a list of dicts with disaster titles, countries, coordinates, and event severity.
    """
    url = "https://www.gdacs.org/xml/rss.xml"
    gdacs_alerts = []
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'SentinelPlan/1.0'})
        with urllib.request.urlopen(req, timeout=4) as response:
            xml_data = response.read()
            root = ET.fromstring(xml_data)

            ns = {
                'gdacs': 'http://www.gdacs.org',
                'geo': 'http://www.w3.org/2003/01/geo/wgs84_pos#'
            }

            for item in root.findall('.//item'):
                title = item.findtext('title', default='Disaster Alert')
                event_type = item.findtext('gdacs:eventtype', default='', namespaces=ns)
                country = item.findtext('gdacs:country', default='Global', namespaces=ns)
                lat_str = item.findtext('geo:lat', default='0.0', namespaces=ns)
                lng_str = item.findtext('geo:long', default='0.0', namespaces=ns)
                pub_date = item.findtext('pubDate', default='')

                if event_type.upper() == 'FL' or 'FLOOD' in title.upper():
                    try:
                        lat = float(lat_str)
                        lng = float(lng_str)
                    except ValueError:
                        lat, lng = 0.0, 0.0

                    gdacs_alerts.append({
                        "title": title,
                        "event_type": "Flood",
                        "country": country,
                        "coordinates": [lat, lng],
                        "pub_date": pub_date
                    })

    except Exception as e:
        print(f"[WARN] Failed to fetch GDACS live feed (using cached data): {e}")

    return gdacs_alerts

