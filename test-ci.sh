#!/bin/bash

# Local CI Test Script
# Replicates GitHub Actions CI workflow locally

set -e  # Exit on any error

echo "🚀 Starting Local CI Test..."
echo "================================"

# Clean previous build
echo "🧹 Cleaning previous build..."
rm -rf dist/ node_modules/

# Install dependencies (like CI does)
echo "📦 Installing dependencies..."
npm ci

# Build project
echo "🔨 Building project..."
npm run build

# Run tests
echo "🧪 Running tests..."
npm test

# Check build artifacts
echo "📁 Checking build artifacts..."
ls -la dist/

echo "✅ Local CI Test Completed Successfully!"
echo "Your code should pass GitHub Actions CI."