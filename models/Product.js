const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    trim: true
  },
  specifications: {
    type: Map,
    of: String,
    default: {}
  },
  applications: [{
    type: String,
    trim: true
  }],
  cloudinaryImages: [{
    type: String
  }],
  isFeatured: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Generate slug from name before saving
productSchema.pre('save', function(next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '');
  }
  next();
});

module.exports = mongoose.model('Product', productSchema);



