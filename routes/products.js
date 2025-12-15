const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const Product = require('../models/Product');
const auth = require('../middleware/auth');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
if (process.env.CLOUDINARY_CLOUD_NAME) {
  cloudinary.config({
    public_id: 'sarhad',
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

// Multer for in-memory file uploads
const upload = multer({ storage: multer.memoryStorage() });

// GET /api/products
router.get('/', async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/products/:slug
router.get('/:slug', async (req, res) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/products/upload-images (protected)
router.post('/upload-images', auth, upload.array('images', 10), async (req, res) => {
  try {
    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      return res.status(500).json({ message: 'Cloudinary is not configured on the server.' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No images provided.' });
    }

    const uploadPromises = req.files.map(
      (file) =>
        new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder: 'sarhad-products',
            },
            (error, result) => {
              if (error) return reject(error);
              resolve(result.secure_url);
            }
          );

          stream.end(file.buffer);
        })
    );

    const urls = await Promise.all(uploadPromises);
    res.json({ urls });
  } catch (error) {
    console.error('Error uploading images to Cloudinary:', error);
    res.status(500).json({ message: 'Failed to upload images.' });
  }
});

// POST /api/products (protected)
router.post(
  '/',
  auth,
  [body('name').notEmpty().trim(), body('description').notEmpty()],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, description, category, specifications, applications, cloudinaryImages, isFeatured } = req.body;

      let slug =
        req.body.slug ||
        name
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, '');

      const product = new Product({
        name,
        slug,
        description,
        category,
        specifications: specifications || {},
        applications: applications || [],
        cloudinaryImages: cloudinaryImages || [],
        isFeatured: !!isFeatured,
      });

      await product.save();
      res.status(201).json(product);
    } catch (error) {
      if (error.code === 11000) {
        return res.status(400).json({ message: 'Product with this slug already exists' });
      }
      console.error('Error creating product:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// PUT /api/products/:id (protected)
router.put(
  '/:id',
  auth,
  [body('name').optional().notEmpty().trim(), body('description').optional().notEmpty()],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, description, category, specifications, applications, cloudinaryImages, isFeatured, slug } =
        req.body;

      const product = await Product.findById(req.params.id);
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }

      if (name) product.name = name;
      if (description) product.description = description;
      if (category !== undefined) product.category = category;
      if (specifications) product.specifications = specifications;
      if (applications) product.applications = applications;
      if (cloudinaryImages) product.cloudinaryImages = cloudinaryImages;
      if (typeof isRegistered !== 'undefined') product.isFeatured = isFeatured;
      if (slug) product.slug = slug;

      await product.save();
      res.json(product);
    } catch (error) {
      if (error.code === 11000) {
        return res.status(400).json({ message: 'Product with this slug already exists' });
      }
      console.error('Error updating product:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// DELETE /api/products/:id (protected)
router.delete('/:id', auth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Optionally delete images from Cloudinary
    if (product.cloudinaryImages && product.cloudinaryImages.length > 0 && process.env.CLOUDINARY_CLOUD_NAME) {
      for (const imageUrl of product.cloudinaryImages) {
        try {
          const publicId = imageUrl.split('/').pop().split('.')[0];
          await cloudinary.uploader.destroy(publicId);
        } catch (cloudErr) {
          console.error('Error deleting image from Cloudinary:', cloudErr);
        }
      }
    }

    await product.deleteOne();
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;


