const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Admin = require('../models/Admin');

// Ensure we always load the .env from the server root, even when running from /utils
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sarhad-corporation');
    
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@sarhadcorporation.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: adminEmail });
    if (existingAdmin) {
      console.log('Admin already exists');
      await mongoose.connection.close();
      return;
    }

    // Create admin
    const admin = new Admin({
      email: adminEmail,
      password: adminPassword
    });

    await admin.save();
    console.log('Admin created successfully:', adminEmail);
    console.log('Password:', adminPassword);
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error seeding admin:', error);
    await mongoose.connection.close();
  }
};

seedAdmin();



