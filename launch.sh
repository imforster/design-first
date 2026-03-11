#!/usr/bin/env bash
set -e

echo "🧩 Sudoku Game - Launch Script"
echo "==============================="

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  npm install
fi

# Build the project
echo "🔨 Building..."
npm run build

# Launch preview server
echo "🚀 Starting server..."
echo ""
npm run preview
