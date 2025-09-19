const Product = require('../../models/Product');
const Category = require('../../models/Category');

// Homepage products
exports.getHomepageProducts = async (req, res) => {
  try {
    const processProduct = p => ({
      ...p,
      _id: p._id.toString(), // ID to string
      price: `₹${p.price.toFixed(2)}`,
      imageUrl: p.images && p.images.length > 0 ? p.images[0] : '/images/placeholder.jpg'
    });

    // New Arrivals
    const newArrivals = await Product.find({ isDeleted: false, status: true })
      .sort({ createdAt: -1 })
      .limit(4)
      .lean();

    // Trending Products (placeholder)
    const trending = await Product.find({ isDeleted: false, status: true })
      .sort({ price: -1 })
      .limit(4)
      .lean();

    // Explore More
    const exploreMore = await Product.aggregate([
      { $match: { isDeleted: false, status: true } },
      { $sample: { size: 4 } }
    ]);

    res.render('index', {
      title: 'WatchStore | Home',
      newArrivals: newArrivals.map(processProduct),
      trending: trending.map(processProduct),
      exploreMore: exploreMore.map(processProduct)
    });

  } catch (error) {
    console.error('Error fetching homepage products:', error);
    res.status(500).render('404', { title: 'Error', message: 'Could not load homepage.' });
  }
};

// List products
exports.listProducts = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.max(1, parseInt(req.query.limit || '12', 10));
    const search = req.query.q || '';
    const sort = req.query.sort || '';
    const skip = (page - 1) * limit;

    // Build query
    let query = { 
      isDeleted: false, 
      status: true 
    };

    // Search
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } }
      ];
    }

    // Category filter
    if (req.query.category) {
      const categories = Array.isArray(req.query.category) ? req.query.category : [req.query.category];
      const categoryIds = await Category.find({ 
        name: { $in: categories }, 
        isDeleted: false, 
        status: true 
      }).distinct('_id');
      if (categoryIds.length > 0) {
        query.category = { $in: categoryIds };
      }
    }

    // Brand filter
    if (req.query.brand) {
      const brands = Array.isArray(req.query.brand) ? req.query.brand : [req.query.brand];
      query.brand = { $in: brands };
    }

    // Price range filter
    if (req.query.minPrice || req.query.maxPrice) {
      query.price = {};
      if (req.query.minPrice) {
        const minPrice = parseFloat(req.query.minPrice);
        if (!isNaN(minPrice)) query.price.$gte = minPrice;
      }
      if (req.query.maxPrice) {
        const maxPrice = parseFloat(req.query.maxPrice);
        if (!isNaN(maxPrice)) query.price.$lte = maxPrice;
      }
    }

    // Build sort
    let sortObj = { createdAt: -1 }; // Default sort
    switch (sort) {
      case 'price_asc':
        sortObj = { price: 1 };
        break;
      case 'price_desc':
        sortObj = { price: -1 };
        break;
      case 'name_asc':
        sortObj = { name: 1 };
        break;
      case 'name_desc':
        sortObj = { name: -1 };
        break;
      case 'rating':
        sortObj = { rating: -1 };
        break;
      case 'new_arrivals':
        sortObj = { createdAt: -1 };
        break;
    }

    // Get products
    const products = await Product.find(query)
      .populate('category', 'name')
      .sort(sortObj)
      .skip(skip)
      .limit(limit)
      .lean();

    // Total count
    const total = await Product.countDocuments(query);
    const totalPages = Math.max(1, Math.ceil(total / limit));

    // Get filter options
    const categories = await Category.find({ isDeleted: false, status: true }).distinct('name');
    const brands = await Product.find({ isDeleted: false, status: true }).distinct('brand');

    res.render('shop', {
      title: 'Shop',
      products: products.map(p => ({
        ...p,
        price: `₹${p.price.toFixed(2)}`,
        imageUrl: p.images && p.images.length > 0 ? p.images[0] : '/images/placeholder.jpg'
      })),
      query: req.query,
      filters: { categories, brands },
      pagination: { page, totalPages, total, limit }
    });

  } catch (error) {
    console.error('List products error:', error);
    res.status(500).render('404', { 
      title: 'Error',
      message: 'Error loading products' 
    });
  }
};

// Product details
exports.productDetails = async (req, res) => {
  try {
    const { id } = req.params;
    
    const product = await Product.findById(id)
      .populate('category', 'name')
      .lean();

    // Redirect if not found
    if (!product || product.isDeleted || !product.status) {
      return res.redirect('/shop');
    }

    // Check category
    if (!product.category) {
      console.error(`Product with ID ${id} has a missing or deleted category.`);
      return res.redirect('/shop');
    }

    // Related products
    const related = await Product.find({
      category: product.category._id,
      _id: { $ne: product._id },
      isDeleted: false,
      status: true
    })
    .limit(4)
    .lean();

    res.render('products/detail', { 
      title: product.name, 
      product, 
      related 
    });

  } catch (error) {
    console.error('Product details error:', error);
    res.redirect('/shop');
  }
};
