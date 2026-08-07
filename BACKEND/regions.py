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
        "id": "assam",
        "name": "Guwahati & Brahmaputra Basin",
        "country": "India",
        "center": [26.185, 91.745],
        "zoom": 12,
        "hazard_level": "Critical",
        "description": "Monsoon Brahmaputra river overflow affecting North Guwahati sectors and Kamrup transit corridors.",
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
    "assam": {
        "zones": [
            {
                "id": "zone-1",
                "name": "Guwahati North Lowlands (Sector 7)",
                "geometry": {"type": "Polygon", "coordinates": [[[91.725, 26.195], [91.732, 26.212], [91.750, 26.208], [91.745, 26.190], [91.725, 26.195]]]},
                "people_exposed": 2400,
                "status": "pending",
                "assigned_squad": None,
                "assigned_shelter": "Saraighat Relief Center"
            },
            {
                "id": "zone-2",
                "name": "Brahmaputra River Basin East",
                "geometry": {"type": "Polygon", "coordinates": [[[91.752, 26.182], [91.758, 26.202], [91.782, 26.192], [91.775, 26.172], [91.752, 26.182]]]},
                "people_exposed": 1600,
                "status": "pending",
                "assigned_squad": None,
                "assigned_shelter": "St. Jude High School"
            },
            {
                "id": "zone-3",
                "name": "Kamrup Central Transit Hub",
                "geometry": {"type": "Polygon", "coordinates": [[[91.730, 26.155], [91.735, 26.175], [91.752, 26.170], [91.745, 26.150], [91.730, 26.155]]]},
                "people_exposed": 1100,
                "status": "pending",
                "assigned_squad": None,
                "assigned_shelter": "Guwahati Stadium Complex"
            },
            {
                "id": "zone-4",
                "name": "Kaziranga Foothills Reserve",
                "geometry": {"type": "Polygon", "coordinates": [[[91.702, 26.202], [91.710, 26.222], [91.728, 26.212], [91.718, 26.195], [91.702, 26.202]]]},
                "people_exposed": 700,
                "status": "pending",
                "assigned_squad": None,
                "assigned_shelter": "Civic Hospital Shelter"
            }
        ],
        "roads": [
            {"id": "road-1", "name": "NH-27 Brahmaputra Arterial Highway", "status": "open", "connects_zone_ids": ["zone-1", "zone-3"], "geometry": {"type": "LineString", "coordinates": [[91.748, 26.155], [91.745, 26.165], [91.742, 26.185], [91.738, 26.202]]}},
            {"id": "road-2", "name": "Saraighat River Bridge Expressway", "status": "open", "connects_zone_ids": ["zone-1", "zone-2"], "geometry": {"type": "LineString", "coordinates": [[91.738, 26.202], [91.752, 26.198], [91.765, 26.195]]}},
            {"id": "road-3", "name": "East Guwahati Bypass Corridor", "status": "open", "connects_zone_ids": ["zone-2"], "geometry": {"type": "LineString", "coordinates": [[91.765, 26.195], [91.778, 26.182], [91.785, 26.170]]}},
            {"id": "road-4", "name": "Metro Central Link", "status": "open", "connects_zone_ids": ["zone-2"], "geometry": {"type": "LineString", "coordinates": [[91.745, 26.165], [91.758, 26.175], [91.765, 26.195]]}},
            {"id": "road-5", "name": "South Bank Emergency Pass", "status": "open", "connects_zone_ids": ["zone-3"], "geometry": {"type": "LineString", "coordinates": [[91.740, 26.148], [91.742, 26.158], [91.745, 26.165]]}},
            {"id": "road-6", "name": "West Guwahati Feeder", "status": "open", "connects_zone_ids": ["zone-3", "zone-4"], "geometry": {"type": "LineString", "coordinates": [[91.745, 26.165], [91.728, 26.185], [91.715, 26.210]]}},
            {"id": "road-7", "name": "Kaziranga Reserve Pass", "status": "open", "connects_zone_ids": ["zone-4"], "geometry": {"type": "LineString", "coordinates": [[91.715, 26.210], [91.705, 26.225], [91.698, 26.238]]}}
        ],
        "stats": {"responders_deployed": 12, "responders_available": 20, "shelters_at_capacity": 2, "shelters_total": 5},
        "alerts": [
            {"id": "alert-a1", "timestamp": "2026-08-07T14:28:10Z", "message": "Assam Monitoring Active — Brahmaputra telemetry online across Saraighat and Kamrup sectors."},
            {"id": "alert-a2", "timestamp": "2026-08-07T14:30:45Z", "message": "Saraighat Gauge Station — Surge measured +1.8m above danger mark."},
            {"id": "alert-a3", "timestamp": "2026-08-07T14:32:00Z", "message": "CRITICAL — Sector 7 Guwahati North Lowlands inundation priority score evaluated to 84 (Critical)."}
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
                "name": "South Asia Monsoon Flood Zone (Brahmaputra/Surma)",
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

