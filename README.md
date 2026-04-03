# Almaty Smart City Decision Dashboard

An AI-powered infrastructure prioritization system for city officials in Almaty, Kazakhstan. It scores road segments and traffic camera zones by financial impact and safety ROI, using a dual-brain architecture: deterministic Python scoring (Brain 1) feeds a local LLM (Brain 2) for qualitative enrichment.

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  Frontend — React 19 + Vite                         │
│  localhost:5173                                     │
│  Dashboard UI for city officials                    │
└──────────────────────┬──────────────────────────────┘
                       │
          ┌────────────┴────────────┐
          │                        │
          ▼                        ▼
┌─────────────────┐     ┌──────────────────────────────┐
│ Backend API     │     │ AI Microservice               │
│ FastAPI + SQLite│     │ FastAPI — localhost:8001      │
│ localhost:8000  │     │                              │
│                 │     │  ┌─────────────────────────┐ │
│ CRUD endpoints  │     │  │ Brain 1 (Deterministic)  │ │
│ Data persistence│     │  │ brain1_scoring.py        │ │
└─────────────────┘     │  │                         │ │
                        │  │ Roads + Cameras → ranked │ │
                        │  │ scores + tenge figures  │ │
                        │  └───────────┬─────────────┘ │
                        │              │               │
                        │              ▼               │
                        │  ┌─────────────────────────┐ │
                        │  │ Brain 2 (LLM Enrichment) │ │
                        │  │ Ollama qwen2.5:7b        │ │
                        │  │                         │ │
                        │  │ Enrichment, overlaps,   │ │
                        │  │ anomaly detection       │ │
                        │  └─────────────────────────┘ │
                        └──────────────────────────────┘
```

---

## Dual-Brain AI Flow

```
roads.json + cameras.json
         │
         ▼
┌─────────────────────────────────────────────────────┐
│  BRAIN 1 — Deterministic Python Scoring             │
│                                                     │
│  Roads:                     Cameras:                │
│  • road_pressure (0–1)      • safety_gap (0–1)      │
│  • priority_score (0–100)   • priority_score (0–100)│
│  • financial_impact (tenge) • roi_score             │
│  • data_completeness_score  • breakeven_months      │
│  • risk flags               • risk flags            │
│    (is_critical,              (is_survivorship_     │
│     is_high_freeze_risk,       bias_case,           │
│     is_truck_heavy)            is_critical_gap)     │
│                                                     │
│  Sorted by priority_score ↓ (highest first)         │
└───────────────────────┬─────────────────────────────┘
                        │  Top N segments + aggregates
                        ▼
┌─────────────────────────────────────────────────────┐
│  BRAIN 2 — Ollama qwen2.5:7b (temp=0.3)            │
│                                                     │
│  JOB 1 — Enrichment                                 │
│    Qualitative risk context Brain 1 math can't see  │
│    urgency_adjustment: higher / lower / unchanged   │
│                                                     │
│  JOB 2 — Cross-Domain Overlap Detection             │
│    Road failure + camera gap on same corridor?      │
│    Causal connections → compounding risk            │
│                                                     │
│  JOB 3 — Anomaly Detection                          │
│    Type A: unexpected scores (why is seg_003 low?)  │
│    Type B: implausible data (no accidents + no      │
│            violations = broken sensor, not safety)  │
│                                                     │
│  Overall confidence = avg_completeness×100 - 5×TypeB│
└───────────────────────┬─────────────────────────────┘
                        │
                        ▼
         pipeline.py merges both outputs
                        │
                        ▼
        UnifiedAnalysisResponse
        ├── brain1_roads (ranked segments)
        ├── brain1_cameras (ranked zones)
        ├── brain2 (enrichment, overlaps, anomalies)
        ├── key_insights (summary flags)
        ├── executive_summary (headline + tenge totals)
        └── merged_recommendations (sorted action list)
```

---

## Data Parameters

### Roads — `ai/data/roads.json`

8 road segments across Almaty, each with:

| Field | Type | Description | Source Tier |
|---|---|---|---|
| `id` | string | Segment identifier (e.g. `seg_001`) | — |
| `name` | string | Road name + section | — |
| `class` | string | Road class (see below) | — |
| `dailyTrafficVehicles` | int | Average vehicles/day | T3 calibrated |
| `truckSharePercent` | float | Heavy vehicle % (nonlinear damage via 4th-power law) | T1/T3 |
| `segmentLengthKm` | float | Segment length | T1 |
| `lastRepairedYear` | int | Year of last full rehabilitation | T1 |
| `defectsPer100m` | float | Potholes + cracks per 100m | T2 derived |
| `freezeExposureScore` | float 0–1 | Almaty freeze-thaw exposure (35 cycles/year) | T2 |
| `currentSeverity` | string | `good` / `degraded` / `critical` | T1 |
| `failureProbability12mo` | float 0–1 | Risk of critical failure within 12 months | T2 |
| `fixCostTenge` | int | Planned repair cost (≈82.75M tenge/km) | T2 |
| `emergencyRepairCostTenge` | int | Emergency repair = fixCost × 3.2 | T2 |
| `savingsIfFixedNowTenge` | int | `emergencyCost - fixCost` | derived |
| `coordinates` | object | `{lat, lng}` for map display | T1 |

**Road classes** (affect economic multipliers):
- `arterial` — 2.0x disruption, 15M tenge/day economic value
- `sub_arterial` — 1.5–1.7x disruption, 8–10M tenge/day
- `collector` — 1.2x disruption, 3M tenge/day
- `residential` — 1.0x disruption, 1M tenge/day

**Data tiers:** T1 = real sensor/survey data · T2 = derived from real rates · T3 = calibrated model

**Brain 1 road scoring formulas:**
```
road_pressure = defect_score×0.35 + failure_prob×0.25 + freeze_exposure×0.20 + truck_damage×0.20
priority_score = (road_pressure×0.55 + economic_weight×0.35 + traffic_bonus) × 100
financial_impact = (emergency_cost - fix_cost) + (economic_value/day × disruption_days × multiplier)
```

---

### Cameras — `ai/data/cameras.json`

6 intersections — 2 monitored, 4 **unmonitored** (survivorship bias design):

| Field | Type | Description |
|---|---|---|
| `id` | string | Zone identifier (e.g. `cam_001`) |
| `name` | string | Intersection name |
| `roadClass` | string | Road class at this intersection |
| `isMonitored` | bool | `false` = no camera exists yet |
| `violationsPerMonth` | int\|null | Recorded violations — **null for unmonitored zones** |
| `estimatedViolationsPerMonth` | int | Model estimate for unmonitored zones |
| `accidentsPerYear` | float | Police-reported accidents (available even without camera) |
| `coverageGapToNextCameraKm` | float | Distance to nearest camera (gap = blind spot) |
| `dailyTrafficVehicles` | int | Traffic volume |
| `postCameraViolationRate` | float 0–1 | Violation rate 100m–1km *after* the camera ends |
| `riskScore` | float 0–1 | Composite risk rating |
| `annualFineRevenueTenge` | int | Actual revenue (monitored zones only) |
| `projectedAnnualFineRevenueTenge` | int | Revenue projection if camera installed |
| `roiBreakevenMonths` | float | Months to recover 8.5M tenge install cost |

**Survivorship bias:** `violations_per_month = null` does NOT mean the intersection is safe. It means no camera recorded any violations. The `coverageGapToNextCameraKm` and `accidentsPerYear` are the actual risk signals for unmonitored zones. Brain 2's system prompt explicitly flags this.

**Brain 1 camera scoring formulas:**
```
safety_gap = post_camera_rate×0.35 + coverage_gap×0.25 + accident_score×0.20
           + traffic_factor×0.10 + unmonitored_penalty×0.15
roi = (violations/month × 12 × avg_fine × collection_rate - install_cost) / install_cost
     (avg_fine = 28,000 tenge · collection_rate = 0.65 · install_cost = 8,500,000 tenge)
```

---

## API Endpoints

All endpoints served by the AI microservice at `localhost:8001`.

| Method | Path | Needs Ollama | Description |
|---|---|---|---|
| `GET` | `/health` | No | Service health check |
| `GET` | `/analyze/health/ollama` | No | Check if Ollama LLM is running |
| `POST` | `/analyze/unified` | Yes | Full Brain 1 + Brain 2 pipeline |
| `POST` | `/analyze/unified/brain1-only` | No | Brain 1 deterministic scores only |
| `POST` | `/analyze/roads` | Yes | Roads analysis (Brain 1 + LLM) |
| `POST` | `/analyze/roads/brain1` | No | Roads Brain 1 only |
| `POST` | `/analyze/cameras` | Yes | Cameras analysis (Brain 1 + LLM) |
| `POST` | `/analyze/cameras/brain1` | No | Cameras Brain 1 only |
| `POST` | `/analyze/district` | Yes | Legacy district analysis |
| `POST` | `/analyze/simulate` | Yes | Legacy action simulation |

### Example: Brain 1 only (no Ollama required)

```bash
curl -X POST http://localhost:8001/analyze/unified/brain1-only \
  -H "Content-Type: application/json" \
  -d '{}'
```

Response shape:
```json
{
  "brain1_roads": {
    "segments": [...],
    "top_3_priority_ids": ["seg_003", "seg_001", "seg_007"],
    "aggregates": {
      "total_segments": 8,
      "critical_count": 2,
      "total_potential_savings_tenge": 450000000
    }
  },
  "brain1_cameras": {
    "intersections": [...],
    "aggregates": {
      "survivorship_bias_cases": 4,
      "projected_additional_revenue_tenge": 280000000
    }
  },
  "brain2": null,
  "analysis_metadata": {
    "pipeline_mode": "brain1_only",
    "llm_skipped": true
  }
}
```

### Example: Full pipeline (requires Ollama)

```bash
curl -X POST http://localhost:8001/analyze/unified \
  -H "Content-Type: application/json" \
  -d '{"top_n": 3}'
```

---

## Setup

### Prerequisites

- Python 3.11+
- Node.js 18+
- [Ollama](https://ollama.com) (optional — only needed for Brain 2 LLM enrichment)

### AI Service

```bash
cd ai
python -m venv venv

# Windows
.\venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload --port 8001
```

### Backend Service

```bash
cd backend
python -m venv venv
.\venv\Scripts\activate   # or: source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev   # serves at localhost:5173
```

### Ollama (optional — enables Brain 2)

```bash
# Install Ollama from https://ollama.com, then:
ollama pull qwen2.5:7b
ollama serve
```

Verify Brain 2 is available:
```bash
curl http://localhost:8001/analyze/health/ollama
```

---

## Running Without Ollama

The `brain1-only` endpoints skip the LLM entirely and always work:

```
POST /analyze/unified/brain1-only   → full ranked output, no LLM
POST /analyze/roads/brain1          → roads only
POST /analyze/cameras/brain1        → cameras only
```

---

## Running Tests

```bash
cd ai
source venv/Scripts/activate   # Windows: .\venv\Scripts\activate

# 27 unit tests — no Ollama or running server needed
pytest -v

# 4 integration tests — requires Ollama + uvicorn running on :8001
pytest -m integration -v
```

---

## Project Structure

```
.
├── frontend/          React 19 + Vite dashboard UI
├── backend/           FastAPI + SQLAlchemy backend (port 8000)
└── ai/                FastAPI AI microservice (port 8001)
    ├── main.py            App entry point + CORS middleware
    ├── dependencies.py    LRU-cached data loaders
    ├── requirements.txt
    ├── pytest.ini
    ├── data/
    │   ├── roads.json     8 road segments with infrastructure data
    │   └── cameras.json   6 camera zones (2 monitored, 4 unmonitored)
    ├── routers/
    │   ├── analyze.py     /analyze/unified + /analyze/district endpoints
    │   ├── roads.py       /analyze/roads endpoints
    │   └── cameras.py     /analyze/cameras endpoints
    ├── services/
    │   ├── brain1_scoring.py   Deterministic scoring engine
    │   ├── brain2_prompts.py   LLM prompt builder + response parser
    │   ├── ollama_service.py   Ollama HTTP client
    │   └── pipeline.py         Brain 1 → Brain 2 orchestration
    ├── schemas/
    │   └── unified.py     Pydantic models for all inputs/outputs
    └── tests/
        ├── conftest.py        TestClient fixture + autouse LLM mock
        ├── test_health.py
        ├── test_analyze.py
        ├── test_roads.py
        └── test_cameras.py
```

---

## Almaty Context

Brain 2's system prompt includes city-specific facts baked in for all qualitative analysis:

- **35 freeze-thaw cycles/year** — Feb–Apr and Oct–Nov are high-risk seasons
- **Freezing depth: 61 cm** — affects subgrade integrity, not just surface
- **Surface temperature range: -32°C to +42°C** — 74°C annual swing
- **Emergency repair multiplier: 3.2×** — acting now vs. emergency is the core ROI argument
- **Camera install cost: 8,500,000 tenge** (~$18,000 USD)
- **Road rehab cost: 15–82M tenge/km** depending on road class
