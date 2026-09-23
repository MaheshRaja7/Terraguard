# TERRAGUARD AI — System Architecture & Scientific Design

> **Smart India Hackathon 2026 Problem Statement**: `SIH26001`  
> **Domain**: Disaster Management (Ministry of Development of North Eastern Region - MDoNER)  
> **Tagline**: *"Predict Risk. Warn Early. Protect Communities."*

---

## 1. Product Philosophy & Hierarchy

TerraGuard AI is engineered as an **End-to-End Early Warning & Emergency Operations Platform** designed for NDMA, SDRF, District Emergency Operations Centers (DEOC), and field wardens across the 8 North Eastern Region (NER) states.

```
DISASTER RISK
      ↓
AI PREDICTION (XGBoost + SHAP)
      ↓
GIS VISUALIZATION (Leaflet Multi-Layer)
      ↓
EARLY WARNING (Automated Threshold Engine)
      ↓
EMERGENCY RESPONSE (P1/P2 Queues & Offline Field PWA)
```

---

## 2. The Core Scientific Principle

Landslide disaster intelligence does **not** claim to predict the exact minute or millimeter of a slope failure. Instead, it continuously models:

$$\text{Baseline Susceptibility} + \text{Trigger Risk} + \text{Exposure / Impact} = \text{Operational Risk (0--100)}$$

### Three-Layer AI Risk Engine:
1. **Layer 1: Geomorphic Susceptibility**
   - Slope gradient (°), elevation (m), aspect, geological rock weathering grades, historical landslide density, proximity to drainage channels and road corridors.
2. **Layer 2: Meteorological & Environmental Triggers**
   - 1h, 6h, 24h, 72h precipitation accumulation, 24h forecast rain, atmospheric pressure, relative humidity, and multi-depth **modelled soil moisture** (0–7 cm, 7–28 cm, 28–100 cm).
3. **Layer 3: Infrastructure Impact & Exposure**
   - Vulnerable settlement population, strategic highway lifelines (NH-10, NH-29, NH-37), hospitals, bridges, and critical utility corridors.

---

## 3. High-Level Component Architecture

```
                                 TERRAGUARD CLOUD
                                        │
                 ┌──────────────────────┴──────────────────────┐
                 │                                             │
      Next.js 14 Web Frontend                           FastAPI Backend
    (EOC Command Deck, Leaflet)                       (Python 3.10 Engine)
                 │                                             │
                 │                              ┌──────────────┼──────────────┐
                 │                              │              │              │
                 │                          AI Engine     Weather Service  Alert Engine
                 │                         (XGBoost+SHAP)  (Open-Meteo)   (SMS Simulator)
                 │                              │              │              │
                 │                              └──────────────┼──────────────┘
                 │                                             │
                 └──────────────────────┬──────────────────────┘
                                        │
                                        ▼
                                  Data Layer
                  MongoDB Atlas / Resilient Local Persistent Store
                                        ▲
                                        │
                              Offline-First Field PWA
                          (IndexedDB Sync Queue Engine)
```

---

## 4. Disaster Threshold Classification

| Risk Score | Threat Level | Operational Action |
|---|---|---|
| **0 – 25** | `LOW` | Standard vigilance; routine satellite telemetry polling. |
| **26 – 50** | `MODERATE` | Advisory watch; slope drainage checks on exposed corridors. |
| **51 – 75** | `HIGH` | Early warning alert; pre-position emergency clearing teams on NH lifelines. |
| **76 – 100** | `CRITICAL` | Imminent danger warning; automated SMS dispatch; P1 priority response. |

---

## 5. Offline-First PWA Synchronization Flow

When field officers enter deep mountain valleys without cellular reception:
1. Reports are captured with GPS and photo metadata.
2. Stored locally inside browser **IndexedDB** (`sync_queue` table) with state `PENDING`.
3. UI clearly shows `OFFLINE • Queued: X`.
4. As soon as network connectivity is re-established, the background `SyncManager` flushes the queue to `POST /api/sync`.
5. Status transitions: `PENDING` $\rightarrow$ `SYNCING` $\rightarrow$ `SYNCED`.
