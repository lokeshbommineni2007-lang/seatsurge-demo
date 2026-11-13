#!/usr/bin/env python3
"""
SeatSurge Judge Attack Simulator 1: Concurrent Single-Seat Attack
Fires 100 concurrent requests at the EXACT same seat.
Proves ZERO double bookings under high concurrency.
"""

import urllib.request
import json
import time
from concurrent.futures import ThreadPoolExecutor

BASE_URL = "http://localhost:8080/api/hold"
TARGET_SEAT = "A-10"
CONCURRENCY = 100

def send_hold_request(user_index):
    payload = json.dumps({
        "seats": [TARGET_SEAT],
        "userId": f"judge-stress-user-{user_index}",
        "ttlSeconds": 60
    }).encode("utf-8")

    req = urllib.request.Request(
        BASE_URL,
        data=payload,
        headers={"Content-Type": "application/json"}
    )

    start = time.perf_counter()
    try:
        with urllib.request.urlopen(req, timeout=5) as response:
            latency_ms = (time.perf_counter() - start) * 1000
            data = json.loads(response.read().decode())
            return {
                "status_code": response.status,
                "success": data.get("success", False),
                "data": data,
                "latency_ms": latency_ms
            }
    except urllib.error.HTTPError as e:
        latency_ms = (time.perf_counter() - start) * 1000
        data = json.loads(e.read().decode())
        return {
            "status_code": e.code,
            "success": data.get("success", False),
            "data": data,
            "latency_ms": latency_ms
        }
    except Exception as e:
        return {"status_code": 0, "success": False, "error": str(e), "latency_ms": 0}

def run_stress_test():
    print(f"\n========================================================")
    print(f"🔥 FIRING {CONCURRENCY} CONCURRENT REQUESTS AT SEAT: {TARGET_SEAT}")
    print(f"========================================================")

    with ThreadPoolExecutor(max_workers=CONCURRENCY) as executor:
        futures = [executor.submit(send_hold_request, i) for i in range(CONCURRENCY)]
        results = [f.result() for f in futures]

    successes = [r for r in results if r["success"]]
    conflicts = [r for r in results if not r["success"]]
    latencies = sorted([r["latency_ms"] for r in results if r["latency_ms"] > 0])

    p50 = latencies[int(len(latencies) * 0.50)] if latencies else 0
    p95 = latencies[int(len(latencies) * 0.95)] if latencies else 0

    print(f"\n📊 RESULTS SUMMARY:")
    print(f"  • Total Concurrent Requests : {len(results)}")
    print(f"  • Holds Granted             : {len(successes)} (Target: EXACTLY 1)")
    print(f"  • Conflicts Rejected        : {len(conflicts)} (Target: EXACTLY {CONCURRENCY - 1})")
    print(f"  • p50 Latency               : {p50:.2f} ms")
    print(f"  • p95 Latency               : {p95:.2f} ms")

    if len(successes) == 1:
        print("\n✅ TEST PASSED: Exactly 1 user held the seat. ZERO double bookings!")
        winner = successes[0]["data"].get("user_id")
        instance = successes[0]["data"].get("instanceId")
        print(f"  🏆 Winner: {winner} (processed by {instance})")
    else:
        print(f"\n❌ TEST FAILED: {len(successes)} users held the same seat!")

if __name__ == "__main__":
    run_stress_test()
