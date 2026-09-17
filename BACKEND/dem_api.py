import os
import math
import io
import json
import numpy as np
from PIL import Image
from fastapi import APIRouter, HTTPException, Query, Response

router = APIRouter(prefix="/api/dem", tags=["DEM Elevation"])

_dem_processor = None

class DEMProcessor:
    def __init__(self, geotiff_path):
        self.geotiff_path = geotiff_path
        img = Image.open(geotiff_path)
        self.arr = np.array(img, dtype=np.float32)
        self.height, self.width = self.arr.shape
        
        pixel_scale = img.tag_v2.get(33550)
        tiepoint = img.tag_v2.get(33922)
        
        self.sx, self.sy = pixel_scale[0], pixel_scale[1]
        i_p, j_p, k_p, self.min_lon, self.max_lat, z_p = tiepoint[:6]
        
        self.max_lon = self.min_lon + self.width * self.sx
        self.min_lat = self.max_lat - self.height * self.sy
        
        self.center_lat = float((self.min_lat + self.max_lat) / 2.0)
        self.center_lon = float((self.min_lon + self.max_lon) / 2.0)
        
        self.min_elev = float(np.min(self.arr))
        self.max_elev = float(np.max(self.arr))
        self.mean_elev = float(np.mean(self.arr))

    def get_info(self):
        return {
            "dataset": "Copernicus 30m DEM (COP30)",
            "resolution_meters": 30.9,
            "dimensions": [self.width, self.height],
            "bounds": [self.min_lon, self.min_lat, self.max_lon, self.max_lat],
            "center": [self.center_lat, self.center_lon],
            "min_elevation": round(self.min_elev, 2),
            "max_elevation": round(self.max_elev, 2),
            "mean_elevation": round(self.mean_elev, 2),
            "crs": "EPSG:4326 (WGS84)"
        }

    def get_elevation(self, lat: float, lon: float):
        if not (self.min_lat <= lat <= self.max_lat and self.min_lon <= lon <= self.max_lon):
            return None
        
        col = (lon - self.min_lon) / self.sx
        row = (self.max_lat - lat) / self.sy
        
        c0 = int(np.floor(col))
        r0 = int(np.floor(row))
        c1 = min(c0 + 1, self.width - 1)
        r1 = min(r0 + 1, self.height - 1)
        
        dc = col - c0
        dr = row - r0
        
        v00 = self.arr[r0, c0]
        v01 = self.arr[r0, c1]
        v10 = self.arr[r1, c0]
        v11 = self.arr[r1, c1]
        
        top = v00 * (1 - dc) + v01 * dc
        bot = v10 * (1 - dc) + v11 * dc
        return float(round(top * (1 - dr) + bot * dr, 2))

    @staticmethod
    def tile_to_bounds(z: int, x: int, y: int):
        n = 2.0 ** z
        lon_deg_min = x / n * 360.0 - 180.0
        lon_deg_max = (x + 1) / n * 360.0 - 180.0
        
        lat_rad_max = math.atan(math.sinh(math.pi * (1 - 2 * y / n)))
        lat_deg_max = math.degrees(lat_rad_max)
        
        lat_rad_min = math.atan(math.sinh(math.pi * (1 - 2 * (y + 1) / n)))
        lat_deg_min = math.degrees(lat_rad_min)
        
        return lon_deg_min, lat_deg_min, lon_deg_max, lat_deg_max

    def generate_tile_bytes(self, z: int, x: int, y: int, tile_size: int = 256):
        min_lon_t, min_lat_t, max_lon_t, max_lat_t = self.tile_to_bounds(z, x, y)
        
        if max_lon_t < self.min_lon or min_lon_t > self.max_lon or max_lat_t < self.min_lat or min_lat_t > self.max_lat:
            elev_grid = np.full((tile_size, tile_size), self.mean_elev, dtype=np.float32)
        else:
            px = np.linspace(0, 1, tile_size, endpoint=False) + 0.5 / tile_size
            py = np.linspace(0, 1, tile_size, endpoint=False) + 0.5 / tile_size
            
            lons = min_lon_t + px * (max_lon_t - min_lon_t)
            lats = max_lat_t - py * (max_lat_t - min_lat_t)
            
            grid_lon, grid_lat = np.meshgrid(lons, lats)
            
            cols = (grid_lon - self.min_lon) / self.sx
            rows = (self.max_lat - grid_lat) / self.sy
            
            cols_clamped = np.clip(cols, 0, self.width - 1.001)
            rows_clamped = np.clip(rows, 0, self.height - 1.001)
            
            c0 = np.floor(cols_clamped).astype(np.int32)
            r0 = np.floor(rows_clamped).astype(np.int32)
            c1 = np.minimum(c0 + 1, self.width - 1)
            r1 = np.minimum(r0 + 1, self.height - 1)
            
            dc = cols_clamped - c0
            dr = rows_clamped - r0
            
            v00 = self.arr[r0, c0]
            v01 = self.arr[r0, c1]
            v10 = self.arr[r1, c0]
            v11 = self.arr[r1, c1]
            
            top = v00 * (1 - dc) + v01 * dc
            bot = v10 * (1 - dc) + v11 * dc
            elev_grid = top * (1 - dr) + bot * dr
            
            mask_oob = (grid_lon < self.min_lon) | (grid_lon > self.max_lon) | (grid_lat < self.min_lat) | (grid_lat > self.max_lat)
            elev_grid[mask_oob] = self.mean_elev

        # Terrarium RGB encoding
        val = elev_grid + 32768.0
        r = np.floor(val / 256.0).clip(0, 255).astype(np.uint8)
        g = np.floor(val % 256.0).clip(0, 255).astype(np.uint8)
        b = np.floor((val - np.floor(val)) * 256.0).clip(0, 255).astype(np.uint8)
        rgb = np.stack([r, g, b], axis=-1)
        
        img = Image.fromarray(rgb, mode="RGB")
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        return buf.getvalue()

def _get_processor():
    global _dem_processor
    if _dem_processor is None:
        base_dir = os.path.dirname(__file__)
        candidate_paths = [
            os.path.abspath(os.path.join(base_dir, '..', 'dem-data', 'copernicus_30m.tif')),
            os.path.abspath(os.path.join(base_dir, 'dem-data', 'copernicus_30m.tif')),
            os.path.abspath('dem-data/copernicus_30m.tif'),
        ]
        geotiff_path = None
        for p in candidate_paths:
            if os.path.exists(p):
                geotiff_path = p
                break
        
        if geotiff_path:
            try:
                _dem_processor = DEMProcessor(geotiff_path)
                print(f"[DEM API] Loaded Copernicus 30m DEM from {geotiff_path}")
            except Exception as e:
                print(f"[WARN] DEM API processor error: {e}")
    return _dem_processor

@router.get("/info")
def get_dem_info():
    proc = _get_processor()
    if not proc:
        raise HTTPException(status_code=500, detail="Copernicus 30m DEM dataset unavailable.")
    return proc.get_info()

@router.get("/elevation")
def get_elevation(lat: float = Query(..., description="Latitude"), lon: float = Query(..., description="Longitude")):
    proc = _get_processor()
    if not proc:
        raise HTTPException(status_code=500, detail="Copernicus 30m DEM dataset unavailable.")
    elev = proc.get_elevation(lat, lon)
    if elev is None:
        return {
            "lat": lat,
            "lon": lon,
            "elevation_meters": proc.mean_elev,
            "unit": "meters",
            "source": "Copernicus 30m DEM (Fallback Area Mean)",
            "in_bounds": False
        }
    return {
        "lat": lat,
        "lon": lon,
        "elevation_meters": elev,
        "unit": "meters",
        "source": "Copernicus 30m DEM",
        "in_bounds": True
    }

@router.get("/tile/{z}/{x}/{y}.png")
def get_dem_tile(z: int, x: int, y: int):
    # Check static file cache first
    base_dir = os.path.dirname(__file__)
    static_tile_path = os.path.abspath(os.path.join(base_dir, '..', 'FRONTEND', 'public', 'dem-tiles', str(z), str(x), f"{y}.png"))
    if os.path.exists(static_tile_path):
        with open(static_tile_path, "rb") as f:
            return Response(content=f.read(), media_type="image/png")

    proc = _get_processor()
    if not proc:
        raise HTTPException(status_code=500, detail="Copernicus 30m DEM dataset unavailable.")
    
    tile_bytes = proc.generate_tile_bytes(z, x, y)
    return Response(content=tile_bytes, media_type="image/png")
