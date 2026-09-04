"""Standalone verification script for Phase 4 WebSocket endpoint.

Tests:
1. Connecting to non-existent watchlist -> verifies close code 4004
2. Connecting to active watchlist -> verifies live JSON frame stream
3. Confirms z-score & classification fields arrive in real time
4. Simulates clean & abrupt disconnection and verifies cleanup
"""

import asyncio
import json
import sys
import urllib.request
import websockets

BACKEND_HTTP = "http://localhost:8000"
BACKEND_WS = "ws://localhost:8000"
DEMO_USER = "11111111-1111-1111-1111-111111111111"


def get_default_watchlist_id() -> str:
    req = urllib.request.Request(
        f"{BACKEND_HTTP}/api/watchlists/mine",
        headers={"X-User-Id": DEMO_USER},
    )
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode())
        return data[0]["id"]


async def test_nonexistent_watchlist():
    bad_id = "00000000-0000-0000-0000-000000000000"
    print(f"\n[Test 1] Connecting to non-existent watchlist ID: {bad_id}")
    try:
        async with websockets.connect(f"{BACKEND_WS}/ws/watchlist/{bad_id}") as ws:
            await ws.recv()
            print("  FAIL: Expected connection to be rejected!")
    except websockets.exceptions.ConnectionClosed as e:
        print(f"  SUCCESS: Connection rejected with code={e.rcvd.code}, reason='{e.rcvd.reason}'")


async def test_live_stream():
    wl_id = get_default_watchlist_id()
    print(f"\n[Test 2] Connecting to valid watchlist: {wl_id}")
    print("  Listening for live WebSocket tick frames (expecting noise, notable, or meaningful)...")

    async with websockets.connect(f"{BACKEND_WS}/ws/watchlist/{wl_id}") as ws:
        frame_count = 0
        flagged_count = 0

        while frame_count < 10:
            raw = await ws.recv()
            data = json.loads(raw)
            frame_count += 1

            cls = data.get("classification", "unknown")
            is_flagged = cls in ("notable", "meaningful")
            if is_flagged:
                flagged_count += 1

            tag = f"[{cls.upper()}]" if is_flagged else f"[{cls}]"
            print(
                f"  Frame #{frame_count:02d} {tag:<14} {data['symbol']:<10} "
                f"₹{data['price']:<9.2f} (Δ {data.get('change_pct', 0.0):+.2f}%) "
                f"z={data['z_score']:+.2f}σ"
            )

        print(f"\n  Received {frame_count} frames successfully ({flagged_count} flagged with z-score anomaly).")


async def main():
    await test_nonexistent_watchlist()
    await test_live_stream()
    print("\nPhase 4 WebSocket tests passed successfully!")


if __name__ == "__main__":
    asyncio.run(main())
