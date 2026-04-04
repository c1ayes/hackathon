# Smart City Decision Dashboard — Almaty
## Full MVP Roadmap

---

## What This Product Is

A decision-support dashboard for Almaty city managers. Not a data viewer — a ranked action queue with financial justification. Two directions: road decay ROI and traffic camera allocation. One interface. One question answered: **what do I do today, and how much does it save.**

---

## Frontend

### Layout

Single-page app. Three zones:

```
┌─────────────────────────────────────────────────┐
│  HEADER: City status bar + district selector    │
├───────────────┬─────────────────────────────────┤
│               │                                 │
│  LEFT PANEL   │         MAP (center)            │
│  Action Queue │                                 │
│               │                                 │
│               ├─────────────────────────────────┤
│               │  BOTTOM BAR (multi-select)      │
└───────────────┴─────────────────────────────────┘
```

### Header Bar
- City name + current date
- District selector dropdown (Almaly, Bostandyk, Medeu, Alatau, Nauryzbai, Turksib, Zhetysu)
- Toggle: Roads / Cameras / Both
- District budget remaining: `240M tenge available`
- One global alert chip if any segment has days_to_failure < 30: `"⚠ 2 segments critical this month"`

### Left Panel — Action Queue
Ranked list of top segments/cameras by priority_score. Each card:
```
#1  [RED]  Abay Ave — Almaly
           Fix: 18M → Save: 43M
           94 days · ARTERIAL
```
- Color coded by priority (red / orange / yellow)
- Clicking a card flies map to that segment and opens popup
- Unmonitored cameras visually distinct (orange chip)
- Bottom of panel: `"Total savings if top 5 acted on: 187M tenge"`

### Map
- Road segments rendered as colored polylines (gray → red gradient by priority_score)
- Cameras as pins: green = active, orange = unmonitored
- Overlap zones highlighted with a subtle shared color when both road + camera are high priority in same area
- Click segment/camera → popup
- Click + hold → multi-select mode

### Road Segment Popup
```
┌──────────────────────────────────────┐
│ Abay Ave, Almaly          [84] ████  │
│ ARTERIAL                             │
├──────────────────────────────────────┤
│ Fix now:    18M tenge                │
│ If delayed: 61M tenge                │
│ Saves:      43M tenge          ✓     │
│ Economic value: 4.2M/day             │
│ Failure window: 94 days              │
│                                      │
│ "Act now → save 43M tenge"           │
├──────────────────────────────────────┤
│ Surface     ████████░░  78%          │
│ Climate     ██████░░░░  61%          │
│ Truck load  █████░░░░░  52%          │
│ Data quality ███████░░░  87%         │
├──────────────────────────────────────┤
│ 🧠 AI INSIGHT                        │
│ "Freeze exposure + truck share       │
│ combination accelerates failure —    │
│ actual window likely 60–70 days"     │
├──────────────────────────────────────┤
│ ⚠ ANOMALY (84% confidence)           │
│ "Score underestimates urgency —      │
│ PCI inconsistent with pothole count" │
├──────────────────────────────────────┤
│ 🔗 Overlaps camera gap C-04 (Almaly) │
│    → compounding risk          [→]   │
├──────────────────────────────────────┤
│ District budget: 240M available      │
│ This fix: 7.5% of budget             │
│ Queue position: #2 of 12 segments    │
└──────────────────────────────────────┘
```
- Low data completeness (< 0.6) visually dims the popup and adds `"Low data confidence"` label
- Null fields show `"Data unavailable"` not zero
- Overlap badge tappable → highlights linked camera, both popups open simultaneously

### Camera Popup
```
┌──────────────────────────────────────┐
│ Dostyk/Abay, Almaly       [76] ███░  │
│ COLLECTOR          [UNMONITORED]     │
├──────────────────────────────────────┤
│ Install cost:  8.5M (one-time)       │
│ Annual revenue: 34.2M tenge/year     │
│ ROI: 3.02x · Payback: ~3 months     │
│                                      │
│ "Install → earn 34M/year"            │
├──────────────────────────────────────┤
│ Accidents/year nearby:  4            │
│ Est. prevented/year:    ~2           │
│ Cost per accident prevented: 4.25M   │
├──────────────────────────────────────┤
│ ⚠ BEHAVIORAL SIGNAL                  │
│ "Drivers reverting 340m after        │
│ nearest camera — this stretch is     │
│ behaviorally unmonitored"            │
├──────────────────────────────────────┤
│ 🧠 AI INSIGHT                        │
│ "Gap between C-02 and C-04 is known  │
│ reversion zone — placement here      │
│ closes behavioral loophole"          │
├──────────────────────────────────────┤
│ ⚠ DATA FLAG                          │
│ "Active camera, violations = null — │
│ possible data feed issue"            │
├──────────────────────────────────────┤
│ 🔗 Overlaps road segment A-17        │
│    → compounding risk          [→]   │
├──────────────────────────────────────┤
│ District budget: 240M available      │
│ Install cost: 3.5% of budget         │
│ #1 of 6 camera gaps                  │
│ ★ Highest ROI action in district     │
└──────────────────────────────────────┘
```

### Multi-Select Mode
- Click + hold any entity → mode activates, subtle UI shift
- Selected items: highlight ring + checkmark
- Bottom bar floats up: `"3 items selected  [✕ Clear]  [Analyze Section →]"`
- Analyze Section → calls aggregate LLM endpoint → opens section popup

### Section Aggregate Popup
```
┌──────────────────────────────────────┐
│ Camera Section — Almaly District     │
│ 3 cameras · 2 unmonitored · 1 active │
├──────────────────────────────────────┤
│ Total install:   25.5M tenge         │
│ Total revenue:   89M/year            │
│ Combined ROI:    3.5x                │
│ Payback:         ~3.5 months         │
│                                      │
│ "Install all 3 → earn 89M/year"      │
├──────────────────────────────────────┤
│ Coverage: 2.1km currently unmonitored│
│ "Drivers treat this as one           │
│ unmonitored corridor"                │
├──────────────────────────────────────┤
│ 🧠 SECTION INSIGHT                   │
│ [paragraph from LLM on selection     │
│ as a behavioral unit]                │
├──────────────────────────────────────┤
│ INSTALL ORDER                        │
│ 1. C-03 — closes the reversion gap   │
│ 2. C-01 — highest accident history   │
│ 3. C-04 — revenue maximizer          │
├──────────────────────────────────────┤
│ 25.5M of 240M district budget (10.6%)│
│ "Covers highest-risk corridor"       │
└──────────────────────────────────────┘
```
Works identically for road multi-select → `"Road Corridor"` aggregate with total repair cost, combined economic value at risk, combined failure window.

### Visual Language
- Dark theme, near-black background
- Priority colors: red `#E53935` / orange `#FB8C00` / yellow `#FDD835` / green `#43A047`
- UNMONITORED chip: orange. ACTIVE chip: green.
- Typography: IBM Plex Sans (UI) + IBM Plex Mono (numbers/scores)
- Tenge figures always formatted as `XM` or `XB` — never raw integers
- Popups slide in from right, don't block map center

---

## Backend

### Stack
- Python (FastAPI)
- SQLite (`smart_city.db`)
- Ollama (qwen2.5:7b, local)

### Database Schema

**District**
```
id, name, budget_total, budget_available
```

**RoadSegment**
```
id, district_id, name, road_class, length_km, center_lat, center_lng
pothole_count_per_100m, crack_length_per_100m_meters, surface_deformation_mm
pavement_condition_index (PCI 0–100)
road_age_years, utility_cut_count, drainage_condition_score
daily_traffic_vehicles, truck_share_percent
freeze_exposure_score
fix_cost_tenge, emergency_repair_cost_tenge
```

**Camera**
```
id, segment_id, location_name, road_class
is_active, is_monitored, coverage_radius_meters
daily_traffic_vehicles
violations_per_month (null if unmonitored)
post_camera_violations_per_month
accidents_within_500m_per_year
distance_to_next_camera_km
```

No derived scores stored. No risk_score, mood_index, defect_score in DB. Brain 1 computes everything at runtime.

### API Endpoints

```
GET  /api/districts                    → list all districts
GET  /api/districts/{id}/roads         → raw road segments for district
GET  /api/districts/{id}/cameras       → raw camera data for district
POST /api/analyze/district/{id}        → triggers Brain 1 + Brain 2, returns full payload
POST /api/analyze/section              → multi-select aggregate endpoint
     body: { road_ids: [], camera_ids: [] }
```

### Mock Data Requirements
- 8+ road segments across 4 districts (Almaly, Bostandyk, Medeu, Alatau)
- Include: 2 arterial high-truck roads, 2 low-PCI with utility cuts, 1 high freeze exposure hidden risk, 1 clean baseline
- 6+ cameras: 2 unmonitored, 1 high post-camera violations, 1 overlapping a top road segment
- Tenge figures realistic: road repair 15M–80M/km, camera install 8.5M fixed

---

## AI Layer

### Pipeline

```
SQLite DB
    │
    ▼
Brain 1 — Python math (ai_service.py)
    │ deterministic, auditable
    │ produces: ranked output + data_completeness per entity
    ▼
Brain 2 — Ollama LLM (ollama_service.py)
    │ receives Brain 1 output only — never touches raw DB
    │ three jobs: enrichment + overlap detection + anomaly detection
    ▼
Merged single API response → frontend
```

### Brain 1 — Roads Computation

```
surface_score     ← PCI + pothole_count + crack_length + deformation
                     utility_cut penalty + drainage multiplier

climate_pressure  ← freeze_exposure × (35/52)  [Almaty constant]

truck_factor      ← (truck_share/100)^0.5 × 2.0  [nonlinear]

road_pressure     ← surface×0.50 + climate×0.30 + truck×0.20

economic_value    ← daily_traffic × tier_multiplier
                     arterial:850 / collector:400 / residential:120

days_to_failure   ← max(30, int((1 - road_pressure) × 365))

financial_impact  ← (emergency - fix) + (economic_value × days × 0.15)

priority_score    ← road_pressure×60 + (financial_impact/1M)×0.04  [cap 100]

data_completeness ← fraction of expected fields non-null + in range
```

### Brain 1 — Cameras Computation

```
behavioral_risk   ← if monitored: post_camera_violations×0.55 + accidents×0.45
                     if unmonitored: accidents×0.60 + distance_gap×0.40
                     (flagged as estimated)

coverage_gap      ← (1 - radius/150)×0.50 + (distance_to_next/3.0)×0.50

safety_gap        ← behavioral_risk×0.65 + coverage_gap×0.35

annual_revenue    ← traffic×30×12 × violation_rate × 28000 × 0.65

roi_score         ← (annual_revenue - 8_500_000) / 8_500_000

priority_score    ← safety_gap×60 + roi_score×20 + accidents×20  [cap 100]

data_completeness ← same pattern
```

### Brain 2 — Three Jobs

Receives Brain 1 full ranked output. Returns strict JSON. One call.

**Job 1 — Enrichment** (top 3 roads + top 3 cameras)
- Qualitative context Brain 1 math cannot capture
- Hidden risk combinations
- Urgency adjustment: higher / lower / accurate

**Job 2 — Cross-Domain Overlap Detection**
- Compare top roads and camera gaps by district/coordinates
- If overlap: `"Segment X overlaps camera gap Y. Likely because [cause]. Consequence: [Z]. Recommend: [action]"`
- If no overlap: state explicitly + explain

**Job 3 — Anomaly Detection**
- Type A: within-data — segment scores unexpectedly given inputs, most likely explanation + confidence_pct
- Type B: data quality — implausible input combinations, what correct data would look like

**Confidence Score (computed not fake)**
```
base    = avg(all data_completeness scores) × 100
penalty = count(Type B flags) × 5
overall = max(base - penalty, 10)
```

### Brain 2 Output Structure
```json
{
  "enrichment": {
    "roads": [{ "id", "hidden_risks", "urgency_adjustment", "reasoning" }],
    "cameras": [{ "id", "hidden_risks", "urgency_adjustment", "reasoning" }]
  },
  "overlaps": [{
    "road_id", "camera_id", "district",
    "overlap_exists", "causal_explanation", "consequence", "recommendation"
  }],
  "anomalies": {
    "type_a": [{ "entity_id", "entity_type", "observation", "likely_explanation", "confidence_pct" }],
    "type_b": [{ "entity_id", "entity_type", "suspicious_pattern", "why_implausible", "expected_correct_data" }]
  },
  "overall_confidence": {
    "score_pct": 76,
    "calculation_basis": "avg completeness 0.81×100=81, minus 1 Type B flag×5=76",
    "interpretation": "..."
  }
}
```

### Section Aggregate (Multi-Select)
Separate endpoint. Receives selected road_ids + camera_ids. Brain 1 aggregates financials. Brain 2 gets single prompt: analyze this selection as a unit, give install/repair priority order within selection, explain behavioral corridor logic.

---

## What The Demo Shows

Open on active alert → `"Segment A-17 enters critical window in 11 days. Preventive: 18M. Emergency: 61M. Action queued."`

City manager clicks it. Popup shows the full picture. Clicks overlap badge. Camera gap highlights. Sees the compounding risk.

Selects 3 cameras in same corridor. Analyze Section. Gets `"Install C-03 first — closes behavioral reversion gap, costs 8.5M, highest ROI in district."`

**One manager. One screen. What to do today. How much it saves.**

---

## What Makes This Defensible

When judge asks "why can't the akimat do this themselves":

*"They have the data. They don't have the prioritization engine that converts it into a ranked action queue with financial accountability and cross-domain overlap detection. That's this."*
