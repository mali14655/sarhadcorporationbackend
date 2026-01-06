const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Admin = require('../models/Admin');

dotenv.config();

async function main() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('MONGODB_URI is not set in environment variables.');
    process.exit(1);
  }

  const email = process.argv[2];
  const password = process.argv[3];

  if (!email || !password) {
    console.error('Usage: node scripts/createAdmin.js <email> <password>');
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const existing = await Admin.findOne({ email });
    if (existing) {
      console.error('Admin with this email already exists.');
      process.exit(1);
    }

    const admin = new Admin({ email, password });
    await admin.save();

    console.log('Admin created successfully:');
    console.log({ id: admin._id.toString(), email: admin.email });
    process.exit(0);
  } catch (err) {
    console.error('Error creating admin:', err);
    process.exit(1);
  }
}

main();

