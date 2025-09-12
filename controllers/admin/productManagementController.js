const Product = require('../../models/Product');
const Category = require('../../models/Category');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;

// Configure multer for image upload
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
        files: 10 // Maximum 10 files
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'), false);
        }
    }
});

// Image processing function
const processImages = async (files) => {
    const processedImages = [];
    
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const filename = `product_${Date.now()}_${i + 1}.jpg`;
        const filepath = path.join(__dirname, '../../public/images/products', filename);
        
        // Ensure directory exists
        await fs.mkdir(path.dirname(filepath), { recursive: true });
        
        // Process and save image
        await sharp(file.buffer)
            .resize(800, 800, {
                fit: 'inside',
                position: 'center'
            })
            .jpeg({ quality: 85 })
            .toFile(filepath);
            
        processedImages.push(`/images/products/${filename}`);
    }
    
    return processedImages;
};

// Product management page with search and pagination
exports.productManagement = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        const skip = (page - 1) * limit;

        // Build search query (only non-deleted products)
        let query = { isDeleted: false };
        if (search) {
            query = {
                ...query,
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } },
                    { brand: { $regex: search, $options: 'i' } }
                ]
            };
        }

        // Get products with pagination, sorted by newest first
        const products = await Product.find(query)
            .populate('category', 'name')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        // Get total count for pagination
        const totalProducts = await Product.countDocuments(query);
        const totalPages = Math.ceil(totalProducts / limit);

        res.render('admin/product-management', {
            title: 'Product Management',
            admin: req.session.admin,
            products,
            currentPage: page,
            totalPages,
            totalProducts,
            limit,
            search,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
            nextPage: page + 1,
            prevPage: page - 1
        });

    } catch (error) {
        console.error('Product management error:', error);
        res.status(500).render('admin/error', {
            title: 'Error',
            admin: req.session.admin,
            message: 'Error loading product management page'
        });
    }
};

// Add product form
exports.addProductForm = async (req, res) => {
    try {
        const categories = await Category.find({ isDeleted: false, status: true }).sort({ name: 1 });
        
        res.render('admin/add-product', {
            title: 'Add Product',
            admin: req.session.admin,
            categories,
            product: null,
            errors: null
        });
    } catch (error) {
        console.error('Add product form error:', error);
        res.redirect('/admin/products?error=Error loading add product form');
    }
};

// Add product
exports.addProduct = [
    upload.array('images', 10),
    async (req, res) => {
        try {
            const { name, description, price, stock, category, brand, status } = req.body;
            const files = req.files;

            // Validation
            const errors = {};
            if (!name?.trim()) errors.name = 'Product name is required';
            if (!description?.trim()) errors.description = 'Description is required';
            if (!price || price <= 0) errors.price = 'Valid price is required';
            if (!stock || stock < 0) errors.stock = 'Valid stock quantity is required';
            if (!category) errors.category = 'Category is required';
            if (!brand?.trim()) errors.brand = 'Brand is required';
            if (!files || files.length < 1) errors.images = 'At least 1 image is required';

            if (Object.keys(errors).length > 0) {
                const categories = await Category.find({ isDeleted: false, status: true }).sort({ name: 1 });
                return res.render('admin/add-product', {
                    title: 'Add Product',
                    admin: req.session.admin,
                    categories,
                    product: req.body,
                    errors
                });
            }

            // Process images
            const imageUrls = await processImages(files);

            // Create product
            const product = new Product({
                name: name.trim(),
                description: description.trim(),
                price: parseFloat(price),
                stock: parseInt(stock),
                category,
                brand: brand.trim(),
                images: imageUrls,
                status: status === 'active'
            });

            await product.save();

            res.redirect('/admin/products?success=Product added successfully');

        } catch (error) {
            console.error('Add product error:', error);
            const categories = await Category.find({ isDeleted: false, status: true }).sort({ name: 1 });
            res.render('admin/add-product', {
                title: 'Add Product',
                admin: req.session.admin,
                categories,
                product: req.body,
                errors: { general: 'Error adding product. Please try again.' }
            });
        }
    }
];

// Edit product form
exports.editProductForm = async (req, res) => {
    try {
        const { productId } = req.params;
        const product = await Product.findById(productId).populate('category');
        const categories = await Category.find({ isDeleted: false, status: true }).sort({ name: 1 });

        if (!product || product.isDeleted) {
            return res.redirect('/admin/products?error=Product not found');
        }

        res.render('admin/edit-product', {
            title: 'Edit Product',
            admin: req.session.admin,
            categories,
            product,
            errors: null
        });

    } catch (error) {
        console.error('Edit product form error:', error);
        res.redirect('/admin/products?error=Error loading product');
    }
};

// Update product
exports.updateProduct = [
    upload.array('images', 10),
    async (req, res) => {
        try {
            const { productId } = req.params;
            const { name, description, price, stock, category, brand, status, existingImages } = req.body;
            const files = req.files;

            // Get existing product
            const existingProduct = await Product.findById(productId);
            if (!existingProduct || existingProduct.isDeleted) {
                return res.redirect('/admin/products?error=Product not found');
            }

            // Validation
            const errors = {};
            if (!name?.trim()) errors.name = 'Product name is required';
            if (!description?.trim()) errors.description = 'Description is required';
            if (!price || price <= 0) errors.price = 'Valid price is required';
            if (!stock || stock < 0) errors.stock = 'Valid stock quantity is required';
            if (!category) errors.category = 'Category is required';
            if (!brand?.trim()) errors.brand = 'Brand is required';

            // Check total images (existing + new)
            const existingImagesArray = Array.isArray(existingImages) ? existingImages : (existingImages ? [existingImages] : []);
            const totalImages = existingImagesArray.length + (files ? files.length : 0);
            if (totalImages < 1) errors.images = 'At least 1 image is required';

            if (Object.keys(errors).length > 0) {
                const categories = await Category.find({ isDeleted: false, status: true }).sort({ name: 1 });
                return res.render('admin/edit-product', {
                    title: 'Edit Product',
                    admin: req.session.admin,
                    categories,
                    product: { ...existingProduct.toObject(), ...req.body },
                    errors
                });
            }

            // Process new images if any
            let newImageUrls = [];
            if (files && files.length > 0) {
                newImageUrls = await processImages(files);
            }

            // Combine existing and new images
            const finalImages = [...existingImagesArray, ...newImageUrls];

            // Update product
            await Product.findByIdAndUpdate(productId, {
                name: name.trim(),
                description: description.trim(),
                price: parseFloat(price),
                stock: parseInt(stock),
                category,
                brand: brand.trim(),
                images: finalImages,
                status: status === 'active',
                updatedAt: new Date()
            });

            res.redirect('/admin/products?success=Product updated successfully');

        } catch (error) {
            console.error('Update product error:', error);
            res.redirect('/admin/products?error=Error updating product');
        }
    }
];

// Delete product (soft delete)
exports.deleteProduct = async (req, res) => {
    try {
        const { productId } = req.params;

        await Product.findByIdAndUpdate(productId, {
            isDeleted: true,
            deletedAt: new Date()
        });

        res.json({ 
            success: true, 
            message: 'Product deleted successfully' 
        });

    } catch (error) {
        console.error('Delete product error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error deleting product' 
        });
    }
};

module.exports = {
    productManagement: exports.productManagement,
    addProductForm: exports.addProductForm,
    addProduct: exports.addProduct,
    editProductForm: exports.editProductForm,
    updateProduct: exports.updateProduct,
    deleteProduct: exports.deleteProduct
};