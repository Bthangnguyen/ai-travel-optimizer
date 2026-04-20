"""
POI Data Crawler for Hue City
Cross-validation pipeline: OSM → Google Places → TripAdvisor → Manual Review

This script implements a multi-source data collection strategy to ensure
accurate coordinates, opening hours, tags, and budget information.
"""

from __future__ import annotations

import csv
import json
import time
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Any

# Note: Install required packages:
# pip install requests overpy googlemaps


@dataclass
class POIData:
    """Complete POI data structure matching PostGIS schema requirements"""
    poi_id: str
    name: str
    city: str
    lat: float
    lon: float
    tags: list[str]
    visit_minutes: int
    ticket_price: int
    opens_at: str  # HH:MM format
    closes_at: str  # HH:MM format
    outdoor: bool
    priority: int
    description: str
    # Data quality tracking
    source_osm: bool = False
    source_google: bool = False
    source_tripadvisor: bool = False
    needs_manual_review: bool = True


class HuePOICrawler:
    """Multi-source POI data crawler with cross-validation"""
    
    def __init__(self, google_api_key: str | None = None):
        self.google_api_key = google_api_key
        self.pois: list[POIData] = []
        
    def crawl_osm_base_locations(self) -> list[dict[str, Any]]:
        """
        Step 1: Get base coordinates from OpenStreetMap
        Focus on: tourism, historic, amenity categories in Hue
        """
        print("Step 1: Crawling OpenStreetMap for base coordinates...")
        
        try:
            import overpy
        except ImportError:
            print("ERROR: overpy not installed. Run: pip install overpy")
            return []
        
        api = overpy.Overpass()
        
        # Hue bounding box (approximate)
        bbox = "16.35,107.45,16.55,107.65"
        
        queries = [
            # Historic sites and monuments
            f'node["historic"~"monument|castle|memorial"]({bbox});',
            # Tourism attractions
            f'node["tourism"~"attraction|museum|viewpoint|gallery"]({bbox});',
            # Religious sites
            f'node["amenity"~"place_of_worship"]({bbox});',
            # Food and beverage
            f'node["amenity"~"restaurant|cafe"]({bbox});',
            # Markets
            f'node["amenity"="marketplace"]({bbox});',
        ]
        
        osm_locations = []
        
        for query in queries:
            try:
                result = api.query(query)
                for node in result.nodes:
                    osm_locations.append({
                        "osm_id": node.id,
                        "name": node.tags.get("name", "Unknown"),
                        "lat": float(node.lat),
                        "lon": float(node.lon),
                        "osm_tags": dict(node.tags),
                    })
                time.sleep(1)  # Rate limiting
            except Exception as e:
                print(f"OSM query failed: {e}")
                continue
        
        print(f"Found {len(osm_locations)} locations from OSM")
        return osm_locations
    
    def enrich_with_google_places(self, osm_locations: list[dict]) -> list[POIData]:
        """
        Step 2: Enrich with Google Places API
        Get: accurate opening hours, popular times, ratings
        """
        print("\nStep 2: Enriching with Google Places API...")
        
        if not self.google_api_key:
            print("WARNING: No Google API key provided. Skipping Google Places enrichment.")
            print("Set GOOGLE_API_KEY environment variable to enable this feature.")
            return self._create_basic_pois(osm_locations)
        
        try:
            import googlemaps
        except ImportError:
            print("ERROR: googlemaps not installed. Run: pip install googlemaps")
            return self._create_basic_pois(osm_locations)
        
        gmaps = googlemaps.Client(key=self.google_api_key)
        enriched_pois = []
        
        for loc in osm_locations[:500]:  # Limit to 500 to avoid quota issues
            try:
                # Search for place by name and location
                places_result = gmaps.places_nearby(
                    location=(loc["lat"], loc["lon"]),
                    radius=50,
                    name=loc["name"]
                )
                
                if places_result.get("results"):
                    place = places_result["results"][0]
                    place_id = place["place_id"]
                    
                    # Get detailed information
                    details = gmaps.place(place_id=place_id, fields=[
                        "name", "geometry", "opening_hours", "types",
                        "price_level", "rating", "user_ratings_total"
                    ])
                    
                    poi = self._convert_google_to_poi(loc, details["result"])
                    enriched_pois.append(poi)
                else:
                    # Fallback to OSM data only
                    poi = self._create_poi_from_osm(loc)
                    enriched_pois.append(poi)
                
                time.sleep(0.1)  # Rate limiting
                
            except Exception as e:
                print(f"Google Places error for {loc['name']}: {e}")
                poi = self._create_poi_from_osm(loc)
                enriched_pois.append(poi)
        
        print(f"Enriched {len(enriched_pois)} POIs with Google Places data")
        return enriched_pois
    
    def _create_basic_pois(self, osm_locations: list[dict]) -> list[POIData]:
        """Create basic POIs from OSM data only"""
        return [self._create_poi_from_osm(loc) for loc in osm_locations[:500]]
    
    def _create_poi_from_osm(self, loc: dict) -> POIData:
        """Convert OSM location to POI with default values"""
        osm_tags = loc.get("osm_tags", {})
        
        # Infer tags from OSM categories
        tags = []
        if "historic" in osm_tags:
            tags.extend(["culture", "history"])
        if "tourism" in osm_tags:
            tags.append("culture")
        if osm_tags.get("amenity") in ["restaurant", "cafe"]:
            tags.append("food")
        if "religion" in osm_tags or osm_tags.get("amenity") == "place_of_worship":
            tags.append("spiritual")
        
        if not tags:
            tags = ["general"]
        
        # Determine if outdoor
        outdoor = osm_tags.get("tourism") == "viewpoint" or "outdoor" in osm_tags.get("description", "").lower()
        
        return POIData(
            poi_id=f"osm-{loc['osm_id']}",
            name=loc["name"],
            city="hue",
            lat=loc["lat"],
            lon=loc["lon"],
            tags=tags,
            visit_minutes=60,  # Default
            ticket_price=0,  # Unknown
            opens_at="08:00",  # Default
            closes_at="17:00",  # Default
            outdoor=outdoor,
            priority=5,  # Medium priority
            description=osm_tags.get("description", ""),
            source_osm=True,
            needs_manual_review=True
        )
    
    def _convert_google_to_poi(self, osm_loc: dict, google_place: dict) -> POIData:
        """Convert Google Places result to POI"""
        # Extract opening hours
        opens_at = "08:00"
        closes_at = "17:00"
        
        if "opening_hours" in google_place and "periods" in google_place["opening_hours"]:
            periods = google_place["opening_hours"]["periods"]
            if periods and len(periods) > 0:
                period = periods[0]
                if "open" in period:
                    opens_at = period["open"].get("time", "0800")
                    opens_at = f"{opens_at[:2]}:{opens_at[2:]}"
                if "close" in period:
                    closes_at = period["close"].get("time", "1700")
                    closes_at = f"{closes_at[:2]}:{closes_at[2:]}"
        
        # Infer tags from Google types
        google_types = google_place.get("types", [])
        tags = []
        
        if any(t in google_types for t in ["museum", "art_gallery", "tourist_attraction"]):
            tags.append("culture")
        if any(t in google_types for t in ["restaurant", "cafe", "food"]):
            tags.append("food")
        if "park" in google_types:
            tags.extend(["nature", "outdoor"])
        if any(t in google_types for t in ["church", "hindu_temple", "mosque"]):
            tags.append("spiritual")
        
        if not tags:
            tags = ["general"]
        
        # Estimate ticket price from price_level (0-4 scale)
        price_level = google_place.get("price_level", 0)
        ticket_price = price_level * 50000  # Rough estimate
        
        # Determine if outdoor
        outdoor = "park" in google_types or "outdoor" in google_place.get("name", "").lower()
        
        # Calculate priority from rating
        rating = google_place.get("rating", 3.0)
        priority = min(10, max(1, int(rating * 2)))
        
        return POIData(
            poi_id=f"google-{google_place.get('place_id', osm_loc['osm_id'])}",
            name=google_place.get("name", osm_loc["name"]),
            city="hue",
            lat=google_place["geometry"]["location"]["lat"],
            lon=google_place["geometry"]["location"]["lng"],
            tags=tags,
            visit_minutes=60,  # Default, needs manual review
            ticket_price=ticket_price,
            opens_at=opens_at,
            closes_at=closes_at,
            outdoor=outdoor,
            priority=priority,
            description=f"Rating: {rating}/5",
            source_osm=True,
            source_google=True,
            needs_manual_review=True  # Still needs manual verification
        )
    
    def export_to_csv(self, output_path: Path):
        """Export POIs to CSV for manual review"""
        print(f"\nExporting to CSV: {output_path}")
        
        with output_path.open("w", newline="", encoding="utf-8") as f:
            if not self.pois:
                print("No POIs to export")
                return
            
            fieldnames = list(asdict(self.pois[0]).keys())
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            
            for poi in self.pois:
                row = asdict(poi)
                row["tags"] = "|".join(row["tags"])  # Convert list to string
                writer.writerow(row)
        
        print(f"Exported {len(self.pois)} POIs to {output_path}")
        print("\n" + "="*80)
        print("CRITICAL: MANUAL REVIEW REQUIRED")
        print("="*80)
        print("Before seeding to PostGIS, you MUST:")
        print("1. Open the CSV file and verify ALL opening/closing hours")
        print("2. Call venues directly or check official websites")
        print("3. Verify ticket prices and visit duration")
        print("4. Confirm outdoor/indoor classification")
        print("5. Add proper descriptions")
        print("\nWrong time windows = tourists arriving at locked doors!")
        print("="*80)
    
    def export_to_json(self, output_path: Path):
        """Export POIs to JSON format compatible with seed_pois.py"""
        print(f"\nExporting to JSON: {output_path}")
        
        json_data = []
        for poi in self.pois:
            json_data.append({
                "poi_id": poi.poi_id,
                "city": poi.city,
                "name": poi.name,
                "lat": poi.lat,
                "lon": poi.lon,
                "tags": poi.tags,
                "visit_minutes": poi.visit_minutes,
                "ticket_price": poi.ticket_price,
                "opens_at": poi.opens_at,
                "closes_at": poi.closes_at,
                "outdoor": poi.outdoor,
                "priority": poi.priority,
                "description": poi.description
            })
        
        with output_path.open("w", encoding="utf-8") as f:
            json.dump(json_data, f, indent=2, ensure_ascii=False)
        
        print(f"Exported {len(json_data)} POIs to {output_path}")


def main():
    import os
    
    print("="*80)
    print("HUE POI DATA CRAWLER - Multi-Source Cross-Validation Pipeline")
    print("="*80)
    print("\nThis script implements the DEV1 data collection strategy:")
    print("1. OSM → Base coordinates")
    print("2. Google Places → Opening hours & ratings")
    print("3. Export to CSV → Manual review (CRITICAL STEP)")
    print("4. Export to JSON → Ready for PostGIS seeding")
    print("\n" + "="*80 + "\n")
    
    # Initialize crawler
    google_api_key = os.getenv("GOOGLE_API_KEY")
    crawler = HuePOICrawler(google_api_key=google_api_key)
    
    # Step 1: Crawl OSM
    osm_locations = crawler.crawl_osm_base_locations()
    
    if not osm_locations:
        print("\nERROR: No locations found from OSM. Check your internet connection.")
        return
    
    # Step 2: Enrich with Google Places
    crawler.pois = crawler.enrich_with_google_places(osm_locations)
    
    # Step 3: Export for manual review
    output_dir = Path("data")
    output_dir.mkdir(exist_ok=True)
    
    crawler.export_to_csv(output_dir / "hue_pois_raw.csv")
    crawler.export_to_json(output_dir / "hue_pois_raw.json")
    
    print("\n" + "="*80)
    print("NEXT STEPS:")
    print("="*80)
    print("1. Review and clean data/hue_pois_raw.csv manually")
    print("2. Save cleaned version as data/hue_pois_clean.json")
    print("3. Run: python scripts/seed_pois.py --source data/hue_pois_clean.json")
    print("4. Import SQL into PostGIS container")
    print("="*80)


if __name__ == "__main__":
    main()
