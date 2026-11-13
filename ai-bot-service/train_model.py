#!/usr/bin/env python3
"""
AI Bot Detection Model Trainer for SeatSurge (PS07)
Trains a classifier on synthetic labelled browsing sessions.
Reports precision, recall, and F1 score (target >= 0.80).
"""

import pickle
import os
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, f1_score, confusion_matrix

np.random.seed(42)

def generate_synthetic_data(n_samples=4000):
    half = n_samples // 2

    # Human sessions (Label 0)
    human_request_rate = np.random.uniform(0.1, 2.5, half)             # req/sec
    human_click_mean = np.random.uniform(500, 3500, half)              # ms between clicks
    human_click_std = np.random.uniform(150, 800, half)                # high jitter
    human_mouse_jitter = np.random.uniform(0.35, 0.95, half)           # natural curvature
    human_scroll_depth = np.random.uniform(50, 1800, half)             # natural scrolling
    human_account_age = np.random.exponential(120, half) + 1           # days (mature accounts)
    human_path_entropy = np.random.uniform(0.6, 1.0, half)             # high trajectory entropy

    # Bot sessions (Label 1)
    # Bots are fast, low-variance, no-mouse/straight-mouse, brand-new accounts
    bot_request_rate = np.random.uniform(4.0, 45.0, half)              # burst req/sec
    bot_click_mean = np.random.uniform(5, 120, half)                  # sub-100ms clicks
    bot_click_std = np.random.uniform(0.1, 25, half)                   # rigid machine cadence
    bot_mouse_jitter = np.random.uniform(0.0, 0.12, half)              # straight lines or 0
    bot_scroll_depth = np.random.choice([0, 5, 10], half, p=[0.8, 0.15, 0.05])
    bot_account_age = np.random.uniform(0.001, 1.0, half)             # brand-new bot accounts
    bot_path_entropy = np.random.uniform(0.0, 0.25, half)              # zero/low entropy

    X_human = np.column_stack([
        human_request_rate, human_click_mean, human_click_std,
        human_mouse_jitter, human_scroll_depth, human_account_age, human_path_entropy
    ])
    y_human = np.zeros(half)

    X_bot = np.column_stack([
        bot_request_rate, bot_click_mean, bot_click_std,
        bot_mouse_jitter, bot_scroll_depth, bot_account_age, bot_path_entropy
    ])
    y_bot = np.ones(half)

    X = np.vstack([X_human, X_bot])
    y = np.concatenate([y_human, y_bot])

    # Shuffle
    idx = np.random.permutation(len(X))
    return X[idx], y[idx]

def train():
    feature_names = [
        "request_rate", "inter_click_mean_ms", "inter_click_std_ms",
        "mouse_jitter", "scroll_depth", "account_age_days", "path_entropy"
    ]

    print("Generating synthetic browsing sessions...")
    X, y = generate_synthetic_data(5000)

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=42)

    print("Training Random Forest Bot Classifier...")
    model = RandomForestClassifier(n_estimators=100, max_depth=8, random_state=42)
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    f1 = f1_score(y_test, y_pred)
    report = classification_report(y_test, y_pred, target_names=["Human", "Bot"])
    cm = confusion_matrix(y_test, y_pred)

    print("\n" + "="*50)
    print("EVALUATION RESULTS (Target F1 >= 0.80):")
    print(f"Overall F1 Score: {f1:.4f}")
    print("="*50)
    print(report)
    print("Confusion Matrix:")
    print(cm)
    print("="*50)

    print("Feature Importances:")
    for name, imp in zip(feature_names, model.feature_importances_):
        print(f"  {name:22s}: {imp:.4f}")

    # Save model and metadata
    os.makedirs("model", exist_ok=True)
    with open("model/bot_classifier.pkl", "wb") as f:
        pickle.dump({
            "model": model,
            "feature_names": feature_names,
            "f1_score": f1
        }, f)
    print("Model saved to model/bot_classifier.pkl")

if __name__ == "__main__":
    train()
