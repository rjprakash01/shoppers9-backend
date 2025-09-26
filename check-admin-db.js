require('dotenv').config({ path: './shoppers9-admin-backend/.env' });
const mongoose = require('mongoose');

async function checkAdminDatabase() {
  console.log('🔍 Checking admin backend database connection...');
  console.log('ENV MONGODB_URI:', process.env.MONGODB_URI);
  
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/shoppers9';
    console.log('Connecting to:', mongoURI);
    
    await mongoose.connect(mongoURI);
    console.log('Connected to database:', mongoose.connection.name);
    
    const banners = await mongoose.connection.db.collection('banners').find({}).toArray();
    console.log(`Found ${banners.length} banners in this database`);
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkAdminDatabase();