#!/bin/bash
# start.sh
# Simple script to run both the Skincare Analysis backend and frontend

echo "=========================================="
echo " Starting Skincare Analysis Servers...    "
echo "=========================================="
echo ""

# Navigate to backend and start FastAPI in the background
echo "-> Starting Python FastAPI Backend on port 8000..."
cd backend
./myenv/bin/uvicorn main:app --reload &
BACKEND_PID=$!
cd ..

# Wait 2 seconds to ensure backend spins up gracefully
sleep 2

# Start Vite React server in the foreground
echo "-> Starting Vite React Frontend..."
npm run dev

# When Vite is killed (Ctrl+C), kill the backend as well
kill $BACKEND_PID