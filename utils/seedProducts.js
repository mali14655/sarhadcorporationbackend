const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Product = require('../models/Product');

// Ensure we always load the .env from the server root, even when running from /utils
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const products = [
  {
    name: 'Rock Phosphate',
    slug: 'rock-phosphate',
    description: 'Rock Phosphate is a natural source of phosphorus, essential for plant growth and development. Our high-grade Rock Phosphate contains significant amounts of P2O5, making it ideal for fertilizer production and agricultural applications.',
    category: 'Phosphate Minerals',
    specifications: {
      'P2O5 Content': '28%-30%',
      'Mesh Size': '180-200',
      'Moisture': 'Max 2%'
    },
    applications: ['Fertilizer Production', 'Agricultural Use', 'Animal Feed Supplement'],
    isFeatured: true
  },
  {
    name: 'Talc or Soap Stone',
    slug: 'talc-or-soap-stone',
    description: 'Talc, also known as Soap Stone, is a soft mineral with excellent lubricating properties. Our premium Talc is widely used in cosmetics, pharmaceuticals, paper manufacturing, and as a filler in various industrial applications.',
    category: 'Industrial Minerals',
    specifications: {
      'Whiteness': '90-95%',
      'Brightness': '85-90%',
      'Mesh Size': '200-325'
    },
    applications: ['Cosmetics', 'Pharmaceuticals', 'Paper Manufacturing', 'Plastics', 'Paints'],
    isFeatured: true
  },
  {
    name: 'Calcium Fluoride',
    slug: 'calcium-fluoride',
    description: 'Calcium Fluoride (CaF2) is a naturally occurring mineral with high purity. It is essential in the production of hydrofluoric acid, aluminum, and steel manufacturing. Our Calcium Fluoride meets international quality standards.',
    category: 'Fluoride Minerals',
    specifications: {
      'CaF2 Content': '85-95%',
      'SiO2': 'Max 5%',
      'Mesh Size': '100-200'
    },
    applications: ['Steel Manufacturing', 'Aluminum Production', 'Hydrofluoric Acid Production', 'Ceramics'],
    isFeatured: false
  },
  {
    name: 'Calcium Carbonate',
    slug: 'calcium-carbonate',
    description: 'Calcium Carbonate is one of the most versatile industrial minerals. Our high-purity Calcium Carbonate is used extensively in paper, paint, plastic, rubber, and construction industries as a filler and extender.',
    category: 'Carbonate Minerals',
    specifications: {
      'CaCO3 Content': '95-98%',
      'Brightness': '90-95%',
      'Mesh Size': '200-400'
    },
    applications: ['Paper Industry', 'Paints & Coatings', 'Plastics', 'Rubber', 'Construction Materials'],
    isFeatured: true
  },
  {
    name: 'Quartz',
    slug: 'quartz',
    description: 'Quartz is one of the most abundant minerals on Earth. Our high-purity Quartz is used in glass manufacturing, electronics, ceramics, and as a raw material in various industrial processes requiring silica.',
    category: 'Silicate Minerals',
    specifications: {
      'SiO2 Content': '98-99.5%',
      'Fe2O3': 'Max 0.05%',
      'Mesh Size': '100-300'
    },
    applications: ['Glass Manufacturing', 'Electronics', 'Ceramics', 'Foundry', 'Water Filtration'],
    isFeatured: false
  },
  {
    name: 'Dolomite',
    slug: 'dolomite',
    description: 'Dolomite is a calcium magnesium carbonate mineral. Our Dolomite is used in steel production, glass manufacturing, agriculture, and construction. It provides both calcium and magnesium benefits.',
    category: 'Carbonate Minerals',
    specifications: {
      'CaO': '30-32%',
      'MgO': '18-20%',
      'Mesh Size': '100-200'
    },
    applications: ['Steel Production', 'Glass Manufacturing', 'Agriculture', 'Construction', 'Water Treatment'],
    isFeatured: false
  },
  {
    name: 'Brite',
    slug: 'brite',
    description: 'Brite is a high-quality industrial mineral used as a filler and extender in various applications. Our Brite offers excellent brightness and whiteness properties, making it ideal for paper, paint, and plastic industries.',
    category: 'Industrial Minerals',
    specifications: {
      'Brightness': '85-90%',
      'Whiteness': '90-95%',
      'Mesh Size': '200-325'
    },
    applications: ['Paper Industry', 'Paints', 'Plastics', 'Rubber'],
    isFeatured: false
  },
  {
    name: 'Mica',
    slug: 'mica',
    description: 'Mica is a group of silicate minerals known for their excellent electrical insulation properties. Our Mica is used in electronics, construction, cosmetics, and as a filler in various industrial applications.',
    category: 'Silicate Minerals',
    specifications: {
      'Muscovite Content': '90-95%',
      'Mesh Size': '20-200',
      'Moisture': 'Max 1%'
    },
    applications: ['Electronics', 'Construction', 'Cosmetics', 'Paints', 'Plastics'],
    isFeatured: false
  }
];

const seedProducts = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Clear existing products (optional - comment out if you want to keep existing)
    // await Product.deleteMany({});
    
    // Check if products already exist
    const existingProducts = await Product.countDocuments();
    if (existingProducts > 0) {
      console.log('Products already exist in database');
      await mongoose.connection.close();
      return;
    }

    // Insert products
    await Product.insertMany(products);
    console.log(`${products.length} products seeded successfully`);
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error seeding products:', error);
    await mongoose.connection.close();
  }
};

seedProducts();



