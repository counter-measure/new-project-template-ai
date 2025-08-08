#!/bin/bash

# Linear Task Uploader Script
# This script uploads tasks from tasks.json to Linear
# Run from the project root directory

echo "🚀 Linear Task Uploader"
echo "========================"

# Check if we're in the right directory
if [ ! -d "linear" ]; then
    echo "❌ Error: linear directory not found!"
    echo "Please run this script from the project root directory"
    exit 1
fi

# Check if .env file exists in root directory
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found in project root!"
    echo "Please copy linear/env.example to .env and add your Linear API key"
    exit 1
fi

# Change to linear directory
cd linear
echo "📁 Changed to linear directory"

# Check if required files exist in parent directory (project root)
if [ ! -f ../tasks.json ]; then
    echo "❌ Error: tasks.json not found in project root!"
    exit 1
fi

if [ ! -f ../project_metadata.json ]; then
    echo "❌ Error: project_metadata.json not found in project root!"
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d node_modules ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Run the uploader
echo "🔄 Starting task upload..."
npm run dev

echo "✅ Done!"
