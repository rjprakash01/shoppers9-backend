#!/bin/bash

# MongoDB Installation Script for macOS
# This script will install MongoDB Community Edition

echo "🚀 MongoDB Installation Script for Shoppers9 Backend"
echo "================================================="

# Check if Homebrew is installed
if ! command -v brew &> /dev/null; then
    echo "📦 Installing Homebrew first..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    
    # Add Homebrew to PATH for current session
    echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
    eval "$(/opt/homebrew/bin/brew shellenv)"
else
    echo "✅ Homebrew is already installed"
fi

# Install MongoDB
echo "📥 Installing MongoDB Community Edition..."
brew tap mongodb/brew
brew install mongodb-community

# Create data directory
echo "📁 Creating MongoDB data directory..."
sudo mkdir -p /usr/local/var/mongodb
sudo mkdir -p /usr/local/var/log/mongodb
sudo chown $(whoami) /usr/local/var/mongodb
sudo chown $(whoami) /usr/local/var/log/mongodb

# Start MongoDB service
echo "🚀 Starting MongoDB service..."
brew services start mongodb/brew/mongodb-community

# Wait a moment for MongoDB to start
echo "⏳ Waiting for MongoDB to start..."
sleep 5

# Test MongoDB connection
echo "🔍 Testing MongoDB connection..."
if mongosh --eval "db.runCommand('ping').ok" --quiet; then
    echo "✅ MongoDB is running successfully!"
    echo "🌐 MongoDB is available at: mongodb://localhost:27017"
    echo "📊 You can now restart your Shoppers9 backend server"
else
    echo "❌ MongoDB failed to start. Please check the installation."
    echo "💡 Try running: brew services restart mongodb/brew/mongodb-community"
fi

echo ""
echo "📝 Next Steps:"
echo "1. Restart your backend server: npm run dev"
echo "2. The server will automatically connect to MongoDB"
echo "3. Your data will now be persistent across server restarts"
echo ""
echo "🛑 To stop MongoDB: brew services stop mongodb/brew/mongodb-community"
echo "🔄 To restart MongoDB: brew services restart mongodb/brew/mongodb-community"
echo "📊 To check MongoDB status: brew services list | grep mongodb"