const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load env vars from server/.env (works on Vercel if you also set env vars in dashboard)
dotenv.config();

const productsRouter = require('../routes/products');
const authRouter = require('../routes/auth');

const app = express();

// CORS configuration – allow your deployed frontend URL
const allowedOrigin = process.env.CLIENT_URL || process.env.FRONTEND_URL;
app.use(
  cors({
    origin: allowedOrigin || '*',
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount routers (note: Vercel adds /api prefix automatically)
app.use('/products', productsRouter);
app.use('/auth', authRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Serverless API is running' });
});

// Keep a single MongoDB connection across invocations
let isConnected = false;

async function connectToDatabase() {
  if (isConnected) return;

  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/sarhad-corporation';

  await mongoose.connect(uri);
  isConnected = true;
  // eslint-disable-next-line no-console
  console.log('MongoDB connected (serverless)');
}

// Vercel serverless function handler
module.exports = async (req, res) => {
  try {
    await connectToDatabase();
    return app(req, res);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('API error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};


