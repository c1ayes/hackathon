"""
Brain 2 — LLM Prompt Templates

Constructs prompts for the Ollama LLM (qwen2.5:7b) to perform:
1. Enrichment — qualitative context Brain 1 cannot capture
2. Overlap Detection — cross-domain insights (roads + cameras)
3. Anomaly Detection — Type A (within-data) and Type B (data quality)

Brain 2 receives Brain 1's full ranked output as context.
It reasons ON TOP of Brain 1, not independently.
"""

import json
from typing import Any

# Almaty climate context
ALMATY_CONTEXT = """
ALMATY CITY CONTEXT:
- Freeze-thaw cycles per year: 35 (extreme pavement stress)
- High-risk seasons: February–April (spring thaw), October–November (early freeze)
- Freezing depth: 61 cm — affects subgrade integrity
- Surface temperature range: -32°C to +42°C (74°C swing)
- Camera install cost: 8,500,000 tenge (~$18,000 USD)
- Road rehabilitation cost: 15–82 million tenge per km depending on class
- Emergency repair multiplier: 3.2x planned repair cost
"""

SURVIVORSHIP_BIAS_EXPLANATION = """
CRITICAL — SURVIVORSHIP BIAS IN CAMERA DATA:
Unmonitored intersections show null violations_per_month. This does NOT mean they are safe.
It means violations are never recorded because no camera exists to record them.
The absence of data IS the risk signal. Score these zones based on:
- Coverage gap size
- Traffic volume
- Adjacent camera zone violation rates
- Accident history (which IS recorded via police reports)
Do NOT penalize unmonitored zones for missing data. Flag them as high priority.
"""


def build_brain2_prompt(
    brain1_roads: dict,
    brain1_cameras: dict,
    top_n: int = 3
) -> str:
    """
    Build the complete Brain 2 prompt for enrichment, overlap, and anomaly detection.
    
    Args:
        brain1_roads: Output from calculate_all_road_scores()
        brain1_cameras: Output from calculate_all_camera_scores()
        top_n: Number of top segments/zones to analyze (default: 3)
    
    Returns:
        Complete prompt string for LLM
    """
    
    # Extract top N segments for detailed analysis
    top_roads = brain1_roads.get("segments", [])[:top_n]
    top_cameras = brain1_cameras.get("intersections", [])[:top_n]
    
    # Get aggregates
    road_aggregates = brain1_roads.get("aggregates", {})
    camera_aggregates = brain1_cameras.get("aggregates", {})
    
    # Average data completeness for confidence calculation
    avg_road_completeness = road_aggregates.get("avg_data_completeness", 0.8)
    avg_camera_completeness = camera_aggregates.get("avg_data_completeness", 0.8)
    overall_avg_completeness = (avg_road_completeness + avg_camera_completeness) / 2
    
    prompt = f"""You are an AI analyst for the Almaty Smart City Decision Dashboard.
City officials use your output to allocate budget and dispatch maintenance teams.
Return all user-facing text in Russian.
Use only tenge for money amounts and never use dollars or USD.

{ALMATY_CONTEXT}

{SURVIVORSHIP_BIAS_EXPLANATION}

---

BRAIN 1 OUTPUT (deterministic Python scoring — ranked by priority):

=== TOP {top_n} ROAD SEGMENTS ===
{json.dumps(top_roads, indent=2, ensure_ascii=False)}

Road Aggregates:
{json.dumps(road_aggregates, indent=2, ensure_ascii=False)}

=== TOP {top_n} CAMERA ZONES ===
{json.dumps(top_cameras, indent=2, ensure_ascii=False)}

Camera Aggregates:
{json.dumps(camera_aggregates, indent=2, ensure_ascii=False)}

---

YOUR TASK — Complete ALL 3 jobs in ONE response:

**JOB 1 — ENRICHMENT**
For each of the top {top_n} road segments AND top {top_n} camera zones:
- Add qualitative context that Brain 1's math cannot capture
- Flag hidden risk combinations (e.g., high freeze_exposure + high truck_share = nonlinear failure acceleration that additive formulas underestimate)
- Note anything that makes this segment MORE or LESS urgent than its priority_score suggests
- Consider seasonal timing (are we approaching high-risk months?)

**JOB 2 — CROSS-DOMAIN OVERLAP DETECTION**
Compare top road segments with top camera gap zones:
- Check for geographic or contextual overlap (same corridor, same district, connected routes)
- If overlap exists: explain the causal connection and compounding risk
- If no meaningful overlap: explicitly state why the two problems are independent

Format for overlaps:
"Segment X overlaps with camera gap Y. This is likely because [causal explanation]. The compounding risk means [consequence]. Recommended action: [Z]"

**JOB 3 — ANOMALY DETECTION**

Type A — Within-data anomalies:
- Segments scoring unexpectedly low/high given their input combination
- Non-obvious risk patterns (e.g., low defect_score but extreme freeze_exposure + truck_share = imminent risk)
- For each: provide most likely explanation + confidence % (0-100)

Type B — Data quality anomalies:
- Input combinations that are statistically implausible
- Examples: camera_coverage_score ≈ 1.0 but violation_rate ≈ 0 AND accident_history ≈ 0 (suspicious uniformity)
- Examples: very high traffic but unusually low violations (suggests broken sensor or data entry error)
- For each flag: state what's suspicious, why it's implausible, and what correct data would likely look like

---

**OVERALL CONFIDENCE CALCULATION**

You MUST calculate overall_confidence using this formula:
score_pct = (avg_data_completeness × 100) - (5 × type_b_flag_count)

Current avg_data_completeness from Brain 1: {overall_avg_completeness:.2f}
Count your Type B flags and apply the penalty.

---

RESPOND WITH ONLY THIS JSON STRUCTURE (no markdown, no explanation outside JSON, all strings in Russian):

{{
  "enrichment": {{
    "roads": [
      {{
        "segment_id": "...",
        "hidden_risks": "description of risks Brain 1 math may underestimate",
        "urgency_adjustment": "higher/lower/unchanged",
        "reasoning": "why this segment deserves more or less attention",
        "seasonal_note": "relevance to current/upcoming season"
      }}
    ],
    "cameras": [
      {{
        "intersection_id": "...",
        "hidden_risks": "behavioral or contextual risks not in numbers",
        "urgency_adjustment": "higher/lower/unchanged",
        "reasoning": "qualitative factors affecting priority",
        "survivorship_bias_note": "if unmonitored, explain the data gap significance"
      }}
    ]
  }},
  "overlaps": [
    {{
      "road_segment": "segment_id or name",
      "camera_zone": "intersection_id or name",
      "overlap_exists": true,
      "overlap_type": "geographic/corridor/causal",
      "causal_explanation": "why these two problems are connected",
      "compounding_risk": "what happens if both are neglected",
      "recommendation": "unified action that addresses both"
    }}
  ],
  "anomalies": {{
    "type_a": [
      {{
        "entity": "segment/camera ID",
        "entity_type": "road/camera",
        "observation": "what's unexpected about the score",
        "likely_explanation": "most probable cause",
        "confidence_pct": 85
      }}
    ],
    "type_b": [
      {{
        "entity": "segment/camera ID",
        "entity_type": "road/camera",
        "suspicious_pattern": "what combination is implausible",
        "why_implausible": "statistical or logical reasoning",
        "expected_correct_data": "what the data should probably look like"
      }}
    ]
  }},
  "overall_confidence": {{
    "score_pct": 76,
    "calculation_basis": "avg_data_completeness {overall_avg_completeness:.2f} × 100 = {overall_avg_completeness * 100:.0f}, minus 5 × N type_b_flags",
    "interpretation": "brief statement on trustworthiness of this analysis"
  }}
}}

Remember:
- Do NOT hallucinate fields that don't exist in Brain 1 output
- If a field is missing, flag it as a data gap in Type B, don't invent values
- Your confidence calculation must match the formula
- Respond with ONLY the JSON object, no other text
"""
    
    return prompt


def build_roads_only_prompt(brain1_roads: dict, top_n: int = 3) -> str:
    """
    Build a roads-only analysis prompt (backward compatibility).
    """
    top_roads = brain1_roads.get("segments", [])[:top_n]
    aggregates = brain1_roads.get("aggregates", {})
    
    prompt = f"""You are analyzing road maintenance priorities for Almaty, Kazakhstan.
Return all user-facing text in Russian.
Use only tenge for money amounts and never use dollars or USD.

{ALMATY_CONTEXT}

BRAIN 1 ROAD ANALYSIS (deterministic scoring):

Top {top_n} Priority Segments:
{json.dumps(top_roads, indent=2, ensure_ascii=False)}

Aggregates:
{json.dumps(aggregates, indent=2, ensure_ascii=False)}

Based on Brain 1's priority scoring:
1. Which {top_n} segments need immediate intervention this quarter?
2. What is the total ROI argument for acting now vs delaying?
3. Any deceptive cases (looks OK on surface but at risk)?

Return this exact JSON:
{{
  "title": "short decision-ready title under 60 chars",
  "summary": "2-3 sentences with tenge figures and top risk drivers",
  "top_priority_segments": ["segment name 1", "segment name 2", "segment name 3"],
  "total_savings_if_fixed_now_tenge": <int>,
  "recommendations": [
    "Action 1 with tenge estimate",
    "Action 2 with tenge estimate",
    "Action 3 with impact"
  ],
  "confidence": 0.88,
  "hidden_risks": ["risk 1", "risk 2"]
}}"""
    
    return prompt


def build_cameras_only_prompt(brain1_cameras: dict, top_n: int = 2) -> str:
    """
    Build a cameras-only analysis prompt (backward compatibility).
    """
    top_cameras = brain1_cameras.get("intersections", [])[:top_n + 2]  # Include extra for context
    aggregates = brain1_cameras.get("aggregates", {})
    
    prompt = f"""You are analyzing traffic camera coverage gaps for Almaty, Kazakhstan.
Return all user-facing text in Russian.
Use only tenge for money amounts and never use dollars or USD.

{ALMATY_CONTEXT}

{SURVIVORSHIP_BIAS_EXPLANATION}

BRAIN 1 CAMERA ANALYSIS (deterministic scoring):

Priority-Ranked Intersections:
{json.dumps(top_cameras, indent=2, ensure_ascii=False)}

Aggregates:
{json.dumps(aggregates, indent=2, ensure_ascii=False)}

Which {top_n} intersections need cameras installed first, and why?
What is the ROI case?

Return this exact JSON:
{{
  "title": "short decision-ready title under 60 chars",
  "summary": "2-3 sentences: safety gap + revenue opportunity + ROI timeline",
  "top_priority_installs": ["intersection name 1", "intersection name 2"],
  "projected_additional_revenue_tenge": <int>,
  "recommendations": [
    "Install priority 1 — ROI breakeven and revenue figure",
    "Install priority 2 — ROI breakeven and revenue figure",
    "Monitoring recommendation"
  ],
  "confidence": 0.85,
  "survivorship_bias_flags": ["intersection with null data that should be prioritized"]
}}"""
    
    return prompt


def parse_brain2_response(response: dict) -> dict:
    """
    Validate and normalize Brain 2 LLM response.
    
    Ensures all expected fields exist with sensible defaults.
    """
    # Ensure top-level keys exist
    result = {
        "enrichment": response.get("enrichment", {"roads": [], "cameras": []}),
        "overlaps": response.get("overlaps", []),
        "anomalies": response.get("anomalies", {"type_a": [], "type_b": []}),
        "overall_confidence": response.get("overall_confidence", {
            "score_pct": 50,
            "calculation_basis": "Unable to calculate — LLM response incomplete",
            "interpretation": "Low confidence due to parsing issues"
        }),
    }
    
    # Ensure nested structures
    if "roads" not in result["enrichment"]:
        result["enrichment"]["roads"] = []
    if "cameras" not in result["enrichment"]:
        result["enrichment"]["cameras"] = []
    if "type_a" not in result["anomalies"]:
        result["anomalies"]["type_a"] = []
    if "type_b" not in result["anomalies"]:
        result["anomalies"]["type_b"] = []
    
    # Validate confidence score
    conf = result["overall_confidence"]
    if not isinstance(conf.get("score_pct"), (int, float)):
        conf["score_pct"] = 50
    conf["score_pct"] = max(0, min(100, conf["score_pct"]))
    
    return result


def extract_key_insights(brain2_response: dict) -> dict:
    """
    Extract key actionable insights from Brain 2 response for dashboard summary.
    """
    enrichment = brain2_response.get("enrichment", {})
    overlaps = brain2_response.get("overlaps", [])
    anomalies = brain2_response.get("anomalies", {})
    confidence = brain2_response.get("overall_confidence", {})
    
    # Count critical findings
    urgent_roads = [r for r in enrichment.get("roads", []) if r.get("urgency_adjustment") == "higher"]
    urgent_cameras = [c for c in enrichment.get("cameras", []) if c.get("urgency_adjustment") == "higher"]
    active_overlaps = [o for o in overlaps if o.get("overlap_exists")]
    type_a_anomalies = anomalies.get("type_a", [])
    type_b_anomalies = anomalies.get("type_b", [])
    
    return {
        "urgent_road_count": len(urgent_roads),
        "urgent_camera_count": len(urgent_cameras),
        "overlap_count": len(active_overlaps),
        "type_a_anomaly_count": len(type_a_anomalies),
        "type_b_anomaly_count": len(type_b_anomalies),
        "overall_confidence_pct": confidence.get("score_pct", 50),
        "has_data_quality_issues": len(type_b_anomalies) > 0,
        "has_cross_domain_insights": len(active_overlaps) > 0,
        "summary_flags": {
            "urgent_roads": [r.get("segment_id") for r in urgent_roads],
            "urgent_cameras": [c.get("intersection_id") for c in urgent_cameras],
            "overlap_pairs": [(o.get("road_segment"), o.get("camera_zone")) for o in active_overlaps],
        }
    }
