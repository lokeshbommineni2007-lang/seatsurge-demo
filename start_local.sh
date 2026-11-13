#!/usr/bin/env bash
# SeatSurge Master Orchestrator Script

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

echo "=========================================================="
echo "🚀 STARTING SEATSURGE FLASH-SALE PLATFORM"
echo "=========================================================="

mkdir -p "$PROJECT_DIR/logs"
PID_FILE="$PROJECT_DIR/.pids"
> "$PID_FILE"

# 1. Start Redis
if ! pgrep -x "redis-server" > /dev/null; then
    echo "Starting Redis server on port 6379..."
    /opt/homebrew/opt/redis/bin/redis-server --daemonize yes
else
    echo "Redis server is already running."
fi

# 2. Start AI Bot Screening Service (Port 5001)
echo "Starting AI Bot Screening Service on port 5001..."
nohup python3 "$PROJECT_DIR/ai-bot-service/app.py" > "$PROJECT_DIR/logs/bot_service.log" 2>&1 &
BOT_PID=$!
echo $BOT_PID >> "$PID_FILE"
disown $BOT_PID
echo "  [AI Bot Service PID: $BOT_PID]"

# 3. Start App Instance 1 (Port 3001)
echo "Starting App Instance 1 on port 3001..."
nohup env PORT=3001 INSTANCE_ID=app-instance-1 node "$PROJECT_DIR/backend/src/server.js" > "$PROJECT_DIR/logs/app1.log" 2>&1 &
APP1_PID=$!
echo $APP1_PID >> "$PID_FILE"
disown $APP1_PID
echo "  [App 1 PID: $APP1_PID]"

# 4. Start App Instance 2 (Port 3002)
echo "Starting App Instance 2 on port 3002..."
nohup env PORT=3002 INSTANCE_ID=app-instance-2 node "$PROJECT_DIR/backend/src/server.js" > "$PROJECT_DIR/logs/app2.log" 2>&1 &
APP2_PID=$!
echo $APP2_PID >> "$PID_FILE"
disown $APP2_PID
echo "  [App 2 PID: $APP2_PID]"

# 5. Start NGINX Load Balancer (Port 8080)
echo "Starting NGINX Load Balancer on port 8080..."
# Stop previous nginx instance if any
/opt/homebrew/opt/nginx/bin/nginx -s stop 2>/dev/null
/opt/homebrew/opt/nginx/bin/nginx -c "$PROJECT_DIR/nginx/nginx.conf"
echo "  [NGINX Load Balancer Started]"

# 6. Start Frontend (Port 5173)
echo "Starting 3D Frontend on port 5173..."
cd "$PROJECT_DIR/frontend"
nohup npm run dev > "$PROJECT_DIR/logs/frontend.log" 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID >> "$PID_FILE"
disown $FRONTEND_PID
echo "  [Frontend PID: $FRONTEND_PID]"

sleep 2

echo ""
echo "=========================================================="
echo "✅ ALL SERVICES RUNNING!"
echo "=========================================================="
echo "🌐 3D Booking Web App : http://localhost:5173"
echo "⚡ NGINX Load Balancer : http://localhost:8080"
echo "🖥️  App Instance 1    : http://localhost:3001"
echo "🖥️  App Instance 2    : http://localhost:3002"
echo "🧠 AI Bot Screener    : http://localhost:5001"
echo "=========================================================="
echo "To run judge tests:"
echo "  python3 simulator/concurrent_seat_stress.py"
echo "  python3 simulator/overlapping_group_stress.py"
echo "  python3 simulator/idempotency_stress.py"
echo ""
echo "To stop everything, run: ./stop_local.sh"
echo "=========================================================="
