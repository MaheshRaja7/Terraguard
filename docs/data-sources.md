# Data Sources & Scientific Provenance

TerraGuard AI strictly avoids data fabrication. Every data card in the user interface displays explicit badges communicating data provenance, freshness, and whether values are observed, modelled, or historical.

---

## 1. Historical Landslide Inventory
- **Primary Source**: **ISRO / NRSC Landslide Atlas of India (2023)** & NASA Global Landslide Catalog (GLC).
- **Files in Repository**:
  - `LandslideAtlas_new_2023.pdf` (Official 11MB publication from NRSC/ISRO)
  - `Global_Landslide_Catalog_Export_rows.csv` (8.4MB global database)
  - `data/isro/historical_landslides_ner.json` (448 parsed real records within the NER bounding box)
- **Extracted Attributes**: Geographic coordinates, event dates, triggers (monsoon downpours, earthquakes), reported fatalities, and damage descriptors across Sikkim, Assam, Meghalaya, Nagaland, Manipur, Mizoram, Arunachal Pradesh, and Kalimpong/Darjeeling.

---

## 2. Dynamic Weather & Atmospheric Drivers
- **Provider**: Open-Meteo API (`https://api.open-meteo.com/v1/forecast`)
- **Parameters Queried**:
  - `temperature_2m`, `relative_humidity_2m`, `precipitation`, `rain`, `wind_speed_10m`, `surface_pressure`
  - Hourly precipitation history (past 72 hours) and forecast (next 72 hours).
- **Aggregation**: Computes rolling windows: `rain_1h`, `rain_6h`, `rain_24h`, and `rain_72h`.
- **Backend In-Memory Caching**: TTL of 15 minutes to prevent redundant API polling.

---

## 3. Modelled Soil Moisture
- **Source**: Open-Meteo Land Surface Hydrological Reanalysis.
- **Depths Supported**:
  - `soil_moisture_0_to_7cm` (Surface layer — immediate capillary response)
  - `soil_moisture_7_to_28cm` (Root zone layer)
  - `soil_moisture_28_to_100cm` (Deep subsoil bed)
- **Scientific Labeling**: Marked clearly as **"Modelled Soil Moisture"**.
- **Rule**: The system never refers to these values as physical IoT probes unless actual field sensors are installed.

---

## 4. Official IMD Integration Adapter
- **Role**: Authoritative national weather body for India.
- **Behavior**: Adapter interface (`IMDService`). When IMD credentials are unconfigured, the UI clearly displays `"IMD integration not configured (Graceful Fallback Active)"` without crashing.

---

## 5. Terrain & Elevation
- Digital Elevation Model (DEM) gradients and OpenStreetMap road vectors for key national highways (NH-10, NH-29, NH-37).
