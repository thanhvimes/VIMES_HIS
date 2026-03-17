#!/bin/bash
# vClinic Quick Start Script

echo "🚀 Starting vClinic Backend..."

cd backend

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "📝 Please copy .env.example to .env and configure it first:"
    echo "   cp .env.example .env"
    echo "   nano .env"
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install --production
fi

# Start with PM2
if command -v pm2 &> /dev/null; then
    echo "🔄 Starting with PM2..."
    pm2 start src/server.js --name vclinic-backend
    pm2 save
    echo "✅ Backend started with PM2"
    echo "📊 View logs: pm2 logs vclinic-backend"
else
    echo "⚠️  PM2 not found, starting with npm..."
    npm start
fi
