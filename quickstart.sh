#!/bin/bash
# ProTeam Quick Start Script
# Run this to get the project up and running

echo "🚀 ProTeam Quick Start"
echo "===================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Step 1: Database Setup${NC}"
echo "→ Go to: https://supabase.com/dashboard"
echo "→ Open SQL Editor"
echo "→ Copy and paste content from: backend/db/orders.sql"
echo "→ Run the migration (Ctrl+Enter)"
echo ""
echo "→ Then copy and paste: backend/db/services-seed.sql"
echo "→ Run the seeding"
echo ""
read -p "Press Enter once database is ready..."

echo ""
echo -e "${YELLOW}Step 2: Install Dependencies${NC}"
cd backend 2>/dev/null && npm install && cd .. && echo "✓ Backend dependencies installed"
cd frontend 2>/dev/null && npm install && cd .. && echo "✓ Frontend dependencies installed"
echo ""

echo -e "${YELLOW}Step 3: Start Backend${NC}"
echo "Running: cd backend && node server.js"
echo ""
echo "Leave this terminal running and open a NEW terminal for the frontend."
echo ""

cd backend
exec node server.js
