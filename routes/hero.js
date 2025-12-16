const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const Hero = require('../models/Hero');
const auth = require('../middleware/auth');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
if (process.env.CLOUDINARY_CLOUD_NAME) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

// Multer for in-memory file uploads - increase file size limit to 50MB
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
});

// GET /api/hero - Get all hero slides
router.get('/', async (req, res) => {
  try {
    const slides = await Hero.find({ isActive: true }).sort({ order: 1 });
    res.json(slides);
  } catch (error) {
    console.error('Error fetching hero slides:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/hero/upload-image (protected) - Upload hero image
router.post('/upload-image', auth, upload.single('image'), async (req, res) => {
  try {
    // Set CORS headers explicitly
    const origin = req.headers.origin;
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }
    
    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      return res.status(500).json({ message: 'Cloudinary is not configured on the server.' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No image provided.' });
    }
    
    // Check file size (50MB limit)
    if (req.file.size > 50 * 1024 * 1024) {
      return res.status(413).json({ message: 'File too large. Maximum size is 50MB.' });
    }

    const uploadPromise = new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'sarhad-hero',
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result.secure_url);
        }
      );
      stream.end(req.file.buffer);
    });

    const imageUrl = await uploadPromise;
    res.json({ url: imageUrl });
  } catch (error) {
    console.error('Error uploading hero image to Cloudinary:', error);
    res.status(500).json({ message: 'Failed to upload image.' });
  }
});

// POST /api/hero (protected) - Create new hero slide
router.post(
  '/',
  auth,
  [body('image').notEmpty()],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { image, order } = req.body;

      // Get max order to set default
      const maxOrder = await Hero.findOne().sort({ order: -1 });
      const newOrder = order !== undefined ? order : (maxOrder ? maxOrder.order + 1 : 0);

      const heroSlide = new Hero({
        image,
        label: '',
        order: newOrder,
        isActive: true,
      });

      await heroSlide.save();
      res.status(201).json(heroSlide);
    } catch (error) {
      console.error('Error creating hero slide:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// PUT /api/hero/:id (protected) - Update hero slide
router.put(
  '/:id',
  auth,
  [body('image').optional().notEmpty(), body('label').optional()],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const heroSlide = await Hero.findById(req.params.id);
      if (!heroSlide) {
        return res.status(404).json({ message: 'Hero slide not found' });
      }

      if (req.body.image) heroSlide.image = req.body.image;
      if (req.body.order !== undefined) heroSlide.order = req.body.order;
      if (req.body.isActive !== undefined) heroSlide.isActive = req.body.isActive;

      await heroSlide.save();
      res.json(heroSlide);
    } catch (error) {
      console.error('Error updating hero slide:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// DELETE /api/hero/:id (protected) - Delete hero slide
router.delete('/:id', auth, async (req, res) => {
  try {
    const heroSlide = await Hero.findById(req.params.id);
    if (!heroSlide) {
      return res.status(404).json({ message: 'Hero slide not found' });
    }

    // Optionally delete image from Cloudinary
    if (heroSlide.image && process.env.CLOUDINARY_CLOUD_NAME) {
      try {
        const publicId = heroSlide.image.split('/').pop().split('.')[0];
        const folderPath = heroSlide.image.includes('sarhad-hero') ? `sarhad-hero/${publicId}` : publicId;
        await cloudinary.uploader.destroy(folderPath);
      } catch (cloudErr) {
        console.error('Error deleting image from Cloudinary:', cloudErr);
      }
    }

    await heroSlide.deleteOne();
    res.json({ message: 'Hero slide deleted successfully' });
  } catch (error) {
    console.error('Error deleting hero slide:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

