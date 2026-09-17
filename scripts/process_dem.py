import os
import math
import glob
import json
import shutil
import numpy as np
from PIL import Image

def organize_dem_files():
    dem_dir = os.path.abspath('dem-data')
    os.makedirs(dem_dir, exist_ok=True)
    
    # Mapping of raw files to clean filenames
    file_map = {
        'output_hh.tif': 'copernicus_30m.tif',
        'output_be.tif': 'nasadem_30m.tif',
        'output_SRTMGL1.tif': 'srtmgl1_30m.tif'
    }
    
    for old_name, new_name in file_map.items():
        src = os.path.join(dem_dir, old_name)
        dst = os.path.join(dem_dir, new_name)
        if os.path.exists(src) and src != dst:
            shutil.move(src, dst)
            print(f"[DEM] Organized: {old_name} -> {new_name}")
            
    # Also check root directory for any leftover extract
    for old_name, new_name in file_map.items():
        src_root = os.path.join('.', old_name)
        dst = os.path.join(dem_dir, new_name)
        if os.path.exists(src_root):
            shutil.move(src_root, dst)
            print(f"[DEM] Moved from root: {old_name} -> dem-data/{new_name}")

class CopernicusDEMProcessor:
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
        
        self.center_lat = (self.min_lat + self.max_lat) / 2.0
        self.center_lon = (self.min_lon + self.max_lon) / 2.0
        
        self.min_elev = float(np.min(self.arr))
        self.max_elev = float(np.max(self.arr))
        self.mean_elev = float(np.mean(self.arr))

        print(f"[DEM Processor] Loaded Copernicus 30m DEM ({self.width}x{self.height})")
        print(f"               Bounds: Lng [{self.min_lon:.6f}, {self.max_lon:.6f}], Lat [{self.min_lat:.6f}, {self.max_lat:.6f}]")
        print(f"               Elevation: Min {self.min_elev:.2f}m, Max {self.max_elev:.2f}m, Mean {self.mean_elev:.2f}m")

    def get_info(self):
        return {
            'dataset': 'Copernicus 30m DEM (COP30)',
            'resolution_meters': 30.9,
            'dimensions': [self.width, self.height],
            'bounds': [self.min_lon, self.min_lat, self.max_lon, self.max_lat],
            'center': [self.center_lat, self.center_lon],
            'min_elevation': self.min_elev,
            'max_elevation': self.max_elev,
            'mean_elevation': self.mean_elev
        }

    def get_elevation_at(self, lat, lon):
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
        return float(top * (1 - dr) + bot * dr)

    @staticmethod
    def tile_to_bounds(z, x, y):
        n = 2.0 ** z
        lon_deg_min = x / n * 360.0 - 180.0
        lon_deg_max = (x + 1) / n * 360.0 - 180.0
        
        lat_rad_max = math.atan(math.sinh(math.pi * (1 - 2 * y / n)))
        lat_deg_max = math.degrees(lat_rad_max)
        
        lat_rad_min = math.atan(math.sinh(math.pi * (1 - 2 * (y + 1) / n)))
        lat_deg_min = math.degrees(lat_rad_min)
        
        return lon_deg_min, lat_deg_min, lon_deg_max, lat_deg_max

    def generate_tile_rgba(self, z, x, y, tile_size=256, format_type='terrarium'):
        min_lon_t, min_lat_t, max_lon_t, max_lat_t = self.tile_to_bounds(z, x, y)
        
        # Check intersection with DEM bounds
        if max_lon_t < self.min_lon or min_lon_t > self.max_lon or max_lat_t < self.min_lat or min_lat_t > self.max_lat:
            # Outside DEM extent, fill with mean elevation
            elev_grid = np.full((tile_size, tile_size), self.mean_elev, dtype=np.float32)
        else:
            px = np.linspace(0, 1, tile_size, endpoint=False) + 0.5 / tile_size
            py = np.linspace(0, 1, tile_size, endpoint=False) + 0.5 / tile_size
            
            lons = min_lon_t + px * (max_lon_t - min_lon_t)
            # Y in tile goes top-to-bottom, so max_lat_t to min_lat_t
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
            
            # Fill out-of-bound areas smoothly
            mask_oob = (grid_lon < self.min_lon) | (grid_lon > self.max_lon) | (grid_lat < self.min_lat) | (grid_lat > self.max_lat)
            elev_grid[mask_oob] = self.mean_elev

        if format_type == 'terrarium':
            # Terrarium format: h = (R * 256 + G + B / 256) - 32768
            val = elev_grid + 32768.0
            r = np.floor(val / 256.0).clip(0, 255).astype(np.uint8)
            g = np.floor(val % 256.0).clip(0, 255).astype(np.uint8)
            b = np.floor((val - np.floor(val)) * 256.0).clip(0, 255).astype(np.uint8)
            rgb = np.stack([r, g, b], axis=-1)
        else:
            # Mapbox format: h = -10000 + (R * 65536 + G * 256 + B) * 0.1
            val = np.round((elev_grid + 10000.0) * 10.0).astype(np.int64)
            r = ((val // 65536) % 256).clip(0, 255).astype(np.uint8)
            g = ((val // 256) % 256).clip(0, 255).astype(np.uint8)
            b = (val % 256).clip(0, 255).astype(np.uint8)
            rgb = np.stack([r, g, b], axis=-1)
            
        return Image.fromarray(rgb, mode='RGB')

    def generate_static_tileset(self, output_dir, min_zoom=10, max_zoom=14):
        print(f"[DEM] Pre-generating static tile pyramid for zooms {min_zoom}-{max_zoom} into {output_dir}...")
        os.makedirs(output_dir, exist_ok=True)
        count = 0
        
        for z in range(min_zoom, max_zoom + 1):
            n = 2 ** z
            # Find tile index ranges covering DEM bounds
            min_x = int(math.floor((self.min_lon + 180.0) / 360.0 * n))
            max_x = int(math.floor((self.max_lon + 180.0) / 360.0 * n))
            
            min_y = int(math.floor((1.0 - math.log(math.tan(math.radians(self.max_lat)) + 1.0 / math.cos(math.radians(self.max_lat))) / math.pi) / 2.0 * n))
            max_y = int(math.floor((1.0 - math.log(math.tan(math.radians(self.min_lat)) + 1.0 / math.cos(math.radians(self.min_lat))) / math.pi) / 2.0 * n))
            
            for x in range(min_x, max_x + 1):
                for y in range(min_y, max_y + 1):
                    tile_dir = os.path.join(output_dir, str(z), str(x))
                    os.makedirs(tile_dir, exist_ok=True)
                    tile_file = os.path.join(tile_dir, f"{y}.png")
                    
                    img = self.generate_tile_rgba(z, x, y, tile_size=256, format_type='terrarium')
                    img.save(tile_file, "PNG")
                    count += 1
                    
        print(f"[DEM] Done! Generated {count} tiles in {output_dir}")

if __name__ == '__main__':
    organize_dem_files()
    proc = CopernicusDEMProcessor('dem-data/copernicus_30m.tif')
    
    # Save metadata JSON
    meta = proc.get_info()
    with open('dem-data/metadata.json', 'w') as f:
        json.dump(meta, f, indent=2)
        
    # Pre-render tiles to frontend public folder
    public_tiles_dir = os.path.abspath('FRONTEND/public/dem-tiles')
    proc.generate_static_tileset(public_tiles_dir, min_zoom=10, max_zoom=14)
