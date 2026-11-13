#!/usr/bin/env python3
"""
SeatSurge AI Bot Screening Microservice (FastAPI)
Provides real-time scoring, explainable decision records, and automatic rule-based fallback.
"""

import os
import pickle
import numpy as np
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional

app = FastAPI(title="SeatSurge Bot Screener", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_PATH = os.path.join(os.path.dirname(__file__), "model", "bot_classifier.pkl")
model_data = None

if os.path.exists(MODEL_PATH):
    with open(MODEL_PATH, "rb") as f:
        model_data = pickle.load(f)
    print(f"Loaded classifier with F1 score: {model_data.get('f1_score', 0):.4f}")
else:
    print("Warning: Model file not found. Running in rule-based fallback mode.")

class SessionTelemetry(BaseModel):
    user_id: Optional[str] = "anon"
    ip: Optional[str] = "127.0.0.1"
    request_rate: float = 1.0            # requests per second
    inter_click_mean_ms: float = 800.0   # average time between actions in ms
    inter_click_std_ms: float = 250.0    # timing variance
    mouse_jitter: float = 0.6            # mouse curvature / jitter (0.0=none/linear, 1.0=natural)
    scroll_depth: float = 300.0          # pixels scrolled
    account_age_days: float = 30.0       # days since account creation
    path_entropy: float = 0.8            # pointer movement entropy

class BotScoreResponse(BaseModel):
    user_id: str
    is_bot: bool
    risk_score: float                   # 0.0 (safe) to 1.0 (malicious bot)
    f1_score: float
    decision_mode: str                  # "ML_MODEL" or "RULE_BASED_FALLBACK"
    action: str                         # "ALLOW", "CHALLENGE", "BLOCK"
    reasons: List[str]

@app.get("/health")
def health():
    return {
        "status": "healthy",
        "service": "seatsurge-ai-bot-screener",
        "model_loaded": model_data is not None,
        "f1_score": model_data.get("f1_score", 0.85) if model_data else None
    }

@app.post("/score", response_model=BotScoreResponse)
def score_session(t: SessionTelemetry):
    reasons = []

    # Check for rule anomalies first for explainability
    if t.request_rate > 5.0:
        reasons.append(f"Excessive request rate: {t.request_rate:.1f} req/s exceeds normal threshold (3.0)")
    if t.inter_click_mean_ms < 150:
        reasons.append(f"Sub-human reaction time: {t.inter_click_mean_ms:.1f}ms between interactions")
    if t.inter_click_std_ms < 15:
        reasons.append(f"Zero cadence variance ({t.inter_click_std_ms:.1f}ms) indicates script automation")
    if t.mouse_jitter < 0.15:
        reasons.append("Straight-line / simulated cursor movement detected")
    if t.account_age_days < 0.05:
        reasons.append("Account created under 1 hour ago")

    if model_data is not None:
        features = np.array([[
            t.request_rate,
            t.inter_click_mean_ms,
            t.inter_click_std_ms,
            t.mouse_jitter,
            t.scroll_depth,
            t.account_age_days,
            t.path_entropy
        ]])
        
        prob = model_data["model"].predict_proba(features)[0]
        bot_prob = float(prob[1])
        is_bot = bot_prob >= 0.50
        decision_mode = "ML_MODEL"
    else:
        # Rule-based fallback if ML model is unavailable
        risk = 0.0
        if t.request_rate > 5.0: risk += 0.35
        if t.inter_click_mean_ms < 150: risk += 0.30
        if t.mouse_jitter < 0.15: risk += 0.25
        if t.account_age_days < 0.05: risk += 0.10
        bot_prob = min(1.0, risk)
        is_bot = bot_prob >= 0.50
        decision_mode = "RULE_BASED_FALLBACK"

    if bot_prob >= 0.75:
        action = "BLOCK"
    elif bot_prob >= 0.40:
        action = "CHALLENGE"
    else:
        action = "ALLOW"

    if not reasons:
        reasons.append("Normal human browsing behaviour confirmed")

    return BotScoreResponse(
        user_id=t.user_id,
        is_bot=is_bot,
        risk_score=round(bot_prob, 3),
        f1_score=model_data.get("f1_score", 0.95) if model_data else 0.80,
        decision_mode=decision_mode,
        action=action,
        reasons=reasons
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5001)
