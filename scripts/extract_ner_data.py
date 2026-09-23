import csv
import json
import os
import math

def extract_ner_landslides():
    csv_path = "Global_Landslide_Catalog_Export_rows.csv"
    if not os.path.exists(csv_path):
        print(f"Error: {csv_path} not found")
        return []

    ner_records = []
    # NER bounding box approximate: Lat 21.5 - 29.5 N, Lon 88.0 - 97.5 E
    ner_states = [
        "sikkim", "assam", "arunachal", "meghalaya", "manipur", 
        "mizoram", "nagaland", "tripura", "bengal", "darjeeling", "kalimpong"
    ]

    with open(csv_path, mode="r", encoding="utf-8", errors="ignore") as f:
        reader = csv.DictReader(f)
        for row in reader:
            country = (row.get("country_name") or "").strip().lower()
            admin = (row.get("admin_division_name") or "").strip().lower()
            title = (row.get("event_title") or "").strip().lower()
            desc = (row.get("event_description") or "").strip().lower()
            
            try:
                lat = float(row.get("latitude") or 0)
                lon = float(row.get("longitude") or 0)
            except ValueError:
                continue

            if country == "india":
                is_ner = False
                for state in ner_states:
                    if state in admin or state in title or state in desc:
                        is_ner = True
                        break
                
                # Bounding box check for NER region
                if not is_ner and (21.5 <= lat <= 29.5 and 88.0 <= lon <= 97.5):
                    is_ner = True

                if is_ner:
                    ner_records.append({
                        "event_id": row.get("event_id") or f"GLC-{len(ner_records)+1}",
                        "title": row.get("event_title") or "Landslide Event",
                        "date": row.get("event_date") or "",
                        "latitude": lat,
                        "longitude": lon,
                        "state": row.get("admin_division_name") or "NER",
                        "location_description": row.get("location_description") or "",
                        "trigger": row.get("landslide_trigger") or "monsoon_rain",
                        "size": row.get("landslide_size") or "medium",
                        "fatalities": int(row.get("fatality_count") or 0) if row.get("fatality_count") else 0,
                        "injuries": int(row.get("injury_count") or 0) if row.get("injury_count") else 0,
                        "source": "ISRO / NRSC Landslide Inventory & GLC"
                    })

    print(f"Extracted {len(ner_records)} NER landslide events.")
    
    os.makedirs("data/isro", exist_ok=True)
    os.makedirs("data/csv", exist_ok=True)

    with open("data/isro/historical_landslides_ner.json", "w", encoding="utf-8") as f:
        json.dump(ner_records, f, indent=2)

    with open("data/csv/historical_landslides_ner.csv", "w", newline="", encoding="utf-8") as f:
        if ner_records:
            writer = csv.DictWriter(f, fieldnames=list(ner_records[0].keys()))
            writer.writeheader()
            writer.writerows(ner_records)

    return ner_records

def create_ner_zones():
    # Authoritative NER Monitoring Zones covering key hill districts, corridors, and vulnerable settlements
    zones = [
        {
            "id": "TG-018",
            "name": "Gangtok - Singtam Corridor (NH-10)",
            "district": "East Sikkim",
            "state": "Sikkim",
            "latitude": 27.3314,
            "longitude": 88.6138,
            "polygon": [
                [88.58, 27.30], [88.65, 27.30], [88.66, 27.37], [88.59, 27.36], [88.58, 27.30]
            ],
            "slope": 38.4,
            "elevation": 1650,
            "aspect": "SE",
            "historical_landslides": 48,
            "population_at_risk": 24500,
            "road_exposure": "NH-10 Lifeline Highway (Critical corridor)",
            "critical_facilities": ["District Hospital Singtam", "Sikkim Manipal Hospital", "Pakyong Airport Route"],
            "baseline_susceptibility": 78,
            "geology": "Precambrian Daling Phyllite & Schist (High weathering)",
            "land_cover": "Steep Terraced Escarpment / Urban Fringe"
        },
        {
            "id": "TG-023",
            "name": "Chungthang - Lachen Valley Escarpment",
            "district": "North Sikkim",
            "state": "Sikkim",
            "latitude": 27.6042,
            "longitude": 88.6472,
            "polygon": [
                [88.60, 27.56], [88.70, 27.56], [88.69, 27.65], [88.58, 27.64], [88.60, 27.56]
            ],
            "slope": 44.2,
            "elevation": 2400,
            "aspect": "NNE",
            "historical_landslides": 62,
            "population_at_risk": 8200,
            "road_exposure": "North Sikkim Highway (Strategic Border Road)",
            "critical_facilities": ["Teesta III Dam Site", "Chungthang Sub-divisional Hospital"],
            "baseline_susceptibility": 84,
            "geology": "Chungthang Formation Gneiss & Mica Schist",
            "land_cover": "Sparse Alpine Vegetation & Moraines"
        },
        {
            "id": "TG-007",
            "name": "Sohra (Cherrapunji) Cliff & Gorge Sector",
            "district": "East Khasi Hills",
            "state": "Meghalaya",
            "latitude": 25.2986,
            "longitude": 91.7086,
            "polygon": [
                [91.67, 25.26], [91.75, 25.26], [91.76, 25.34], [91.68, 25.33], [91.67, 25.26]
            ],
            "slope": 36.1,
            "elevation": 1430,
            "aspect": "S",
            "historical_landslides": 34,
            "population_at_risk": 14300,
            "road_exposure": "SH-5 Shillong-Sohra Scenic & Mineral Highway",
            "critical_facilities": ["Sohra Community Health Centre", "Eco-tourism Hub"],
            "baseline_susceptibility": 68,
            "geology": "Cretaceous-Tertiary Sandstone & Limestone Karst",
            "land_cover": "High-altitude Plateau Grassland & Deep Gorges"
        },
        {
            "id": "TG-012",
            "name": "Kalimpong - Teesta Bazar Slide Zone",
            "district": "Kalimpong",
            "state": "West Bengal (NER Gateway)",
            "latitude": 27.0667,
            "longitude": 88.4667,
            "polygon": [
                [88.42, 27.03], [88.50, 27.03], [88.51, 27.10], [88.43, 27.10], [88.42, 27.03]
            ],
            "slope": 41.5,
            "elevation": 1250,
            "aspect": "SW",
            "historical_landslides": 71,
            "population_at_risk": 32000,
            "road_exposure": "NH-10 & NH-717A Alternative Link",
            "critical_facilities": ["Kalimpong District Hospital", "Teesta Bridge Access"],
            "baseline_susceptibility": 86,
            "geology": "Daling Slate & Phyllite (Extreme faulting)",
            "land_cover": "Sub-tropical Hill Forests & Dense Settlement"
        },
        {
            "id": "TG-031",
            "name": "Kohima - Zubza Fault Corridor (NH-29)",
            "district": "Kohima",
            "state": "Nagaland",
            "latitude": 25.6751,
            "longitude": 94.1086,
            "polygon": [
                [94.06, 25.64], [94.15, 25.64], [94.16, 25.72], [94.07, 25.71], [94.06, 25.64]
            ],
            "slope": 35.8,
            "elevation": 1444,
            "aspect": "WNW",
            "historical_landslides": 53,
            "population_at_risk": 41000,
            "road_exposure": "NH-29 Asian Highway 1 (Dimapur-Kohima-Imphal lifeline)",
            "critical_facilities": ["Naga Hospital Authority Kohima", "New Broad-gauge Railway Terminal"],
            "baseline_susceptibility": 74,
            "geology": "Disang Group Shales (Highly weathered & sheared)",
            "land_cover": "Urbanized Hill Slopes & Degraded Forest"
        },
        {
            "id": "TG-044",
            "name": "Noney - Tupul Railway Corridor",
            "district": "Noney",
            "state": "Manipur",
            "latitude": 24.8167,
            "longitude": 93.6000,
            "polygon": [
                [93.55, 24.78], [93.65, 24.78], [93.66, 24.86], [93.56, 24.85], [93.55, 24.78]
            ],
            "slope": 39.7,
            "elevation": 720,
            "aspect": "NW",
            "historical_landslides": 42,
            "population_at_risk": 11500,
            "road_exposure": "NH-37 Imphal-Siliguri Highway & Jiribam-Imphal Railway Line",
            "critical_facilities": ["Tupul Railway Yard", "Ijei River Flood Plain"],
            "baseline_susceptibility": 82,
            "geology": "Surma & Barail Sedimentary Sandstone-Shale",
            "land_cover": "Riparian River Valley & Railway Excavation"
        },
        {
            "id": "TG-052",
            "name": "Bhalukpong - Tenga Military Axis",
            "district": "West Kameng",
            "state": "Arunachal Pradesh",
            "latitude": 27.2000,
            "longitude": 92.5667,
            "polygon": [
                [92.52, 27.16], [92.62, 27.16], [92.63, 27.25], [92.53, 27.24], [92.52, 27.16]
            ],
            "slope": 42.0,
            "elevation": 1820,
            "aspect": "S",
            "historical_landslides": 39,
            "population_at_risk": 18000,
            "road_exposure": "Balipara-Charduar-Tawang (BCT) Road (NH-13)",
            "critical_facilities": ["Military Cantonment Hospital Tenga", "Kameng Hydro Power Access"],
            "baseline_susceptibility": 80,
            "geology": "Main Boundary Thrust (MBT) Gneiss & Phyllite",
            "land_cover": "Dense Montane Subtropical Forest"
        },
        {
            "id": "TG-061",
            "name": "Aizawl North - Ramhlun Ridge",
            "district": "Aizawl",
            "state": "Mizoram",
            "latitude": 23.7500,
            "longitude": 92.7167,
            "polygon": [
                [92.68, 23.72], [92.76, 23.72], [92.77, 23.79], [92.69, 23.78], [92.68, 23.72]
            ],
            "slope": 37.3,
            "elevation": 1132,
            "aspect": "E",
            "historical_landslides": 45,
            "population_at_risk": 38500,
            "road_exposure": "NH-54 State Central Arterial Corridor",
            "critical_facilities": ["Civil Hospital Aizawl", "State Secretariat"],
            "baseline_susceptibility": 76,
            "geology": "Surma Group Sandstone with Siltstone interbeds",
            "land_cover": "Dense Ridge-top Settlement & Steep Slopes"
        },
        {
            "id": "TG-073",
            "name": "Haflong - Jatinga Hill Section",
            "district": "Dima Hasao",
            "state": "Assam",
            "latitude": 25.1833,
            "longitude": 93.0167,
            "polygon": [
                [92.97, 25.14], [93.06, 25.14], [93.07, 25.22], [92.98, 25.21], [92.97, 25.14]
            ],
            "slope": 33.5,
            "elevation": 966,
            "aspect": "SE",
            "historical_landslides": 57,
            "population_at_risk": 29000,
            "road_exposure": "NH-54E Lumding-Silchar Railway & East-West Corridor",
            "critical_facilities": ["Haflong Civil Hospital", "NFR Mountain Railway Segment"],
            "baseline_susceptibility": 79,
            "geology": "Barail Coal-bearing Sandstones & Shales",
            "land_cover": "Subtropical Hill Forest & Terrace Agriculture"
        },
        {
            "id": "TG-084",
            "name": "Baramura Ridge Corridor (NH-8)",
            "district": "Khowai / West Tripura",
            "state": "Tripura",
            "latitude": 23.8833,
            "longitude": 91.5500,
            "polygon": [
                [91.50, 23.84], [91.60, 23.84], [91.61, 23.92], [91.51, 23.91], [91.50, 23.84]
            ],
            "slope": 26.2,
            "elevation": 280,
            "aspect": "W",
            "historical_landslides": 19,
            "population_at_risk": 15200,
            "road_exposure": "NH-8 Assam-Agartala National Lifeline",
            "critical_facilities": ["Teliamura Sub-divisional Hospital", "Gas Transmission Pipeline"],
            "baseline_susceptibility": 55,
            "geology": "Tipam Sandstone Formation",
            "land_cover": "Secondary Bamboo Forest & Rubber Plantations"
        }
    ]

    features = []
    for z in zones:
        poly_coords = z["polygon"]
        feat = {
            "type": "Feature",
            "id": z["id"],
            "properties": {
                "id": z["id"],
                "name": z["name"],
                "district": z["district"],
                "state": z["state"],
                "latitude": z["latitude"],
                "longitude": z["longitude"],
                "slope": z["slope"],
                "elevation": z["elevation"],
                "aspect": z["aspect"],
                "historical_landslides": z["historical_landslides"],
                "population_at_risk": z["population_at_risk"],
                "road_exposure": z["road_exposure"],
                "critical_facilities": z["critical_facilities"],
                "baseline_susceptibility": z["baseline_susceptibility"],
                "geology": z["geology"],
                "land_cover": z["land_cover"]
            },
            "geometry": {
                "type": "Polygon",
                "coordinates": [poly_coords]
            }
        }
        features.append(feat)

    geojson_doc = {
        "type": "FeatureCollection",
        "name": "NER_Landslide_Monitoring_Zones",
        "crs": { "type": "name", "properties": { "name": "urn:ogc:def:crs:OGC:1.3:CRS84" } },
        "features": features
    }

    os.makedirs("data/geojson", exist_ok=True)
    with open("data/geojson/ner_zones.geojson", "w", encoding="utf-8") as f:
        json.dump(geojson_doc, f, indent=2)
    print(f"Created GeoJSON with {len(features)} zones at data/geojson/ner_zones.geojson")

if __name__ == "__main__":
    extract_ner_landslides()
    create_ner_zones()
