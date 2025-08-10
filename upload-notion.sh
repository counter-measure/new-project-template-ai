#!/bin/bash

# Notion Upload Script
# This script compiles and runs the TypeScript file to upload documents to Notion

set -e  # Exit on any error

echo "🚀 Starting Notion upload process..."

# Check if project_metadata.json exists
if [ ! -f "project_metadata.json" ]; then
    echo "❌ Error: project_metadata.json not found in current directory"
    echo "Please run this script from the project root directory"
    exit 1
fi

# Check if TypeScript is installed
if ! command -v npx &> /dev/null; then
    echo "❌ Error: npx is not installed. Please install Node.js and npm first."
    exit 1
fi

# Check if ts-node is available, install if not
if ! npx ts-node --version &> /dev/null; then
    echo "📦 Installing ts-node..."
    npm install -g ts-node typescript @types/node
fi

# Check if @notionhq/client is installed
if [ ! -d "node_modules/@notionhq" ]; then
    echo "📦 Installing Notion client..."
    npm install @notionhq/client
fi

echo "🔧 Compiling and running TypeScript..."
echo "📁 Project root: $(pwd)"
echo "📄 Documents to upload: $(jq -r '.notion_docs | join(", ")' project_metadata.json)"
echo "🎯 Notion project: $(jq -r '.notion_project' project_metadata.json)"
echo ""

# Run the TypeScript file
npx ts-node notion/upload-to-notion.ts

echo ""
echo "✅ Notion upload process completed!"
