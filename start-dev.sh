#!/bin/bash
echo "Starting Hardhat node..."
npx hardhat node &
HARDHAT_PID=$!

echo "Waiting for Hardhat to start..."
sleep 5

echo "Starting web server..."
npx serve public -l 3000 &
WEB_PID=$!

echo ""
echo "Development servers started!"
echo "- Hardhat Node: http://localhost:8545"
echo "- Web App: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop both servers"

# Function to cleanup on exit
cleanup() {
    echo "Stopping servers..."
    kill $HARDHAT_PID 2>/dev/null
    kill $WEB_PID 2>/dev/null
    exit
}

# Trap Ctrl+C
trap cleanup INT

# Wait for user to stop
wait
