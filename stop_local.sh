#!/usr/bin/env bash
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_FILE="$PROJECT_DIR/.pids"

echo "Stopping all SeatSurge services..."

if [ -f "$PID_FILE" ]; then
    while read -r pid; do
        if kill -0 "$pid" 2>/dev/null; then
            kill "$pid" 2>/dev/null
            echo "Killed process $pid"
        fi
    done < "$PID_FILE"
    rm -f "$PID_FILE"
fi

# Clean up any lingering processes on ports 3001, 3002, 5001, 5173, 8080
pkill -f "node.*seatsurge.*server.js" 2>/dev/null
pkill -f "python3.*ai-bot-service.*app.py" 2>/dev/null
pkill -f "nginx.*seatsurge" 2>/dev/null
pkill -f "vite.*5173" 2>/dev/null

echo "✅ All SeatSurge services stopped."
