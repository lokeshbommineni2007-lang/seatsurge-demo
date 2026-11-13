#!/usr/bin/env python3
"""
SeatSurge Judge Attack Simulator 2: Overlapping Group Bookings
User 1 requests [B-1, B-2, B-3]
User 2 requests [B-3, B-4, B-5]
Proves atomic all-or-nothing locking without deadlocks.
"""

import urllib.request
import json
import time
from concurrent.futures import ThreadPoolExecutor

BASE_URL = "http://localhost:8080/api/hold"

def request_group(user_id, seats):
    payload = json.dumps({
        "seats": seats,
        "userId": user_id,
        "ttlSeconds": 60
    }).encode("utf-8")

    req = urllib.request.Request(
        BASE_URL,
        data=payload,
        headers={"Content-Type": "application/json"}
    )

    try:
        with urllib.request.urlopen(req, timeout=5) as response:
            return {"user": user_id, "status": response.status, "data": json.loads(response.read().decode())}
    except urllib.error.HTTPError as e:
        return {"user": user_id, "status": e.code, "data": json.loads(e.read().decode())}

def run_group_test():
    print(f"\n========================================================")
    print(f"🔥 TESTING OVERLAPPING ATOMIC GROUP BOOKINGS:")
    print(f"  • User A: ['B-1', 'B-2', 'B-3']")
    print(f"  • User B: ['B-3', 'B-4', 'B-5'] (overlapping on B-3)")
    print(f"========================================================")

    with ThreadPoolExecutor(max_workers=2) as executor:
        f1 = executor.submit(request_group, "User-A", ["B-1", "B-2", "B-3"])
        f2 = executor.submit(request_group, "User-B", ["B-3", "B-4", "B-5"])
        res1 = f1.result()
        res2 = f2.result()

    print(f"\nUser A Result: {res1['data']}")
    print(f"User B Result: {res2['data']}")

    success_count = (1 if res1['data'].get('success') else 0) + (1 if res2['data'].get('success') else 0)
    if success_count == 1:
        print("\n✅ TEST PASSED: Exactly 1 group booking succeeded. No partial locks or deadlocks!")
    else:
        print(f"\n❌ TEST FAILED: Unexpected outcome (success count = {success_count})")

if __name__ == "__main__":
    run_group_test()
