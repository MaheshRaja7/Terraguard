# TERRAGUARD AI — REST API Documentation

Base URL: `http://localhost:8000/api`  
Interactive Swagger UI: `http://localhost:8000/docs`  
ReDoc Specification: `http://localhost:8000/redoc`

---

## 1. System Health & Dashboard
- `GET /health`  
  Returns overall service health, datastore mode, and model loading status.
- `GET /dashboard`  
  Returns high-level command center KPIs (monitored zones, critical zones, active alerts, blocked roads, population at risk, recent alerts, timeline).

---

## 2. GIS Hazard Zones & Historical Data
- `GET /zones`  
  Returns full FeatureCollection GeoJSON of NER hazard monitoring zones. Supports query parameters `state` and `district`.
- `GET /zones/{id}`  
  Returns detailed geomorphic properties for a specific zone.
- `GET /landslides/historical`  
  Returns authentic historical landslide points parsed from ISRO / NRSC inventory and Global Landslide Catalog.

---

## 3. AI Risk Prediction Engine
- `GET /risk/{zone_id}`  
  Combines zone geomorphology with real-time live Open-Meteo weather triggers to evaluate operational risk score (0-100), risk tier, priority, and SHAP factors.
- `POST /risk/predict`  
  Calculates risk for arbitrary coordinates or new locations with no historical records.

---

## 4. Meteorology & Modelled Soil Moisture
- `GET /weather?lat={lat}&lon={lon}`  
  Fetches live weather and multi-depth modelled soil moisture from Open-Meteo with caching and freshness metadata.
- `GET /weather/forecast?lat={lat}&lon={lon}`  
  Fetches hourly 24-hour rainfall projections.
- `GET /weather/soil-moisture?lat={lat}&lon={lon}`  
  Fetches 0–7cm, 7–28cm, and 28–100cm soil saturation details.

---

## 5. Early Warning Alerts & Escalation
- `GET /alerts`  
  Lists all active and historical alerts. Filterable by status (`ACTIVE`, `ACKNOWLEDGED`).
- `POST /alerts/test-critical`  
  Triggers test critical escalation in Zone TG-018, dispatches local SMS simulation, and records timeline event.
- `PATCH /alerts/{id}/acknowledge`  
  Acknowledge alert with duty officer name.

---

## 6. SMS Center & Notification Gateway
- `GET /notifications/sms`  
  Fetches telemetry logs for all SMS dispatches (Queued, Processing, Sent, Delivered).
- `POST /notifications/test-sms`  
  Dispatches a test early warning SMS via the active SMS provider (`local` or `msg91`).

---

## 7. Field Incidents & Strategic Highways
- `GET /incidents`  
  Lists geo-tagged field incident reports.
- `POST /incidents`  
  Submits new ground incident report with GPS coordinates and road blockage linking.
- `GET /roads`  
  Returns monitored highway corridors (NH-10, NH-29, NH-37) with blockage status and detour advisories.
- `PATCH /roads/{id}`  
  Updates road status (`OPEN`, `PARTIAL`, `BLOCKED`, `CRITICAL`).

---

## 8. Ephemeral Risk Simulator
- `POST /simulator/risk`  
  Simulates what-if outcomes across custom rainfall, soil moisture, and slope sliders without modifying production data.

---

## 9. Judge Demo & Offline Synchronization
- `POST /demo/run-scenario`  
  One-click judge scenario runner triggering the complete escalation chain.
- `POST /demo/reset`  
  Restores baseline monitoring.
- `POST /sync`  
  Accepts offline queued reports from IndexedDB and synchronizes them to the server.
- `GET /reports/summary`  
  Generates executive government disaster summary.
- `GET /reports/export-csv`  
  Exports all zone hazard properties as a downloadable CSV.
