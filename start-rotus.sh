#!/bin/bash
# ROTUS Startup Script - The Rotten Brain of POTUS

set -e  # Exit on error

echo "=== ROTUS Startup ==="
echo "Starting ROTUS - The Rotten Brain of POTUS..."
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing Node.js dependencies..."
    npm install
fi

# Check if database exists
if [ ! -f "database/rotus.db" ]; then
    echo "Initializing database..."
    cd database
    node -e "const Database = require('better-sqlite3'); new Database('rotus.db'); console.log('DB created');"
    cd ..
fi

# Start the server
echo ""
echo "Starting ROTUS server on port 3000..."
echo "Web app will be available at: http://localhost:3000"
echo "API endpoints:"
echo "  - http://localhost:3000/api/stats"
echo "  - http://localhost:3000/api/quotes"
echo ""
echo "Press Ctrl+C to stop the server"
echo "=== ROTUS Ready ==="
echo ""

cd webapp
PORT=3000 node server.js
