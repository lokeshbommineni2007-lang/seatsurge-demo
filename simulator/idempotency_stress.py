#!/usr/bin/env python3
"""
SeatSurge Judge Attack Simulator 3: Replay Payment Confirmation
Sends 10 concurrent payment requests with the exact same Idempotency-Key.
Proves ZERO double charges.
"""

import urllib.request
import json
import uuid
from concurrent.futures import ThreadPoolExecutor

BASE_URL = "http://localhost:8080/api"
SEAT = "C-5"
USER_ID = "idempotency-test-user"
IDEMPOTENCY_KEY = f"idem-judge-test-{uuid.uuid4().hex[:8]}"

def prepare_hold():
    payload = json.dumps({"seats": [SEAT], "userId": USER_ID, "ttlSeconds": 120}).encode()
    req = urllib.request.Request(f"{BASE_URL}/hold", data=payload, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode())
    except Exception as e:
        print("Hold failed:", e)
        return None

def send_payment(req_index):
    payload = json.dumps({
        "seats": [SEAT],
        "userId": USER_ID,
        "amount": 2500,
        "idempotencyKey": IDEMPOTENCY_KEY
    }).encode()

    req = urllib.request.Request(
        f"{BASE_URL}/checkout",
        data=payload,
        headers={
            "Content-Type": "application/json",
            "Idempotency-Key": IDEMPOTENCY_KEY
        }
    )

    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode())
    except Exception as e:
        return {"error": str(e)}

def run_test():
    print(f"\n========================================================")
    print(f"🔥 TESTING REPLAY PAYMENT CONFIRMATION:")
    print(f"  • Idempotency-Key: {IDEMPOTENCY_KEY}")
    print(f"  • Seat: {SEAT}")
    print(f"========================================================")

    print("Step 1: Acquiring hold...")
    hold = prepare_hold()
    if not hold or not hold.get("success"):
        print("Could not acquire hold, skipping.")
        return

    print("Step 2: Sending 10 identical payment confirmations concurrently...")
    with ThreadPoolExecutor(max_workers=10) as executor:
        futures = [executor.submit(send_payment, i) for i in range(10)]
        results = [f.result() for f in futures]

    booking_ids = set(r.get("booking_id") for r in results if r.get("booking_id"))
    replays = [r for r in results if r.get("is_idempotent_replay")]

    print(f"\n📊 RESULTS:")
    print(f"  • Unique Booking IDs Created : {len(booking_ids)} (Target: EXACTLY 1)")
    print(f"  • Total Responses Received   : {len(results)}")
    print(f"  • Idempotent Cached Replays  : {len(replays)} / 9 replays identified")

    if len(booking_ids) == 1:
        print("\n✅ TEST PASSED: Exactly 1 transaction processed! ZERO double charges!")
        print(f"  💳 Confirmed Booking ID: {list(booking_ids)[0]}")
    else:
        print(f"\n❌ TEST FAILED: Multiple bookings created: {booking_ids}")

if __name__ == "__main__":
    run_test()
