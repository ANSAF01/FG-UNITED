const Category = require('../../models/Category');

// Category management
exports.categoryManagement = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 2;
        const search = req.query.search || '';
        const skip = (page - 1) * limit;

        // Search query
        let query = { isDeleted: false };
        if (search) {
            query = {
                ...query,
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } }
                ]
            };
        }

        // Get categories
        const categories = await Category.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        // Total count
        const totalCategories = await Category.countDocuments(query);
        const totalPages = Math.ceil(totalCategories / limit);

        res.render('admin/category-management', {
            title: 'Category Management',
            admin: req.session.admin,
            categories,
            currentPage: page,
            totalPages,
            totalCategories,
            limit,
            search,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
            nextPage: page + 1,
            prevPage: page - 1
        });

    } catch (error) {
        console.error('Category management error:', error);
        res.status(500).render('admin/error', {
            title: 'Error',
            admin: req.session.admin,
            message: 'Error loading category management page'
        });
    }
};

// Add category form
exports.addCategoryForm = (req, res) => {
    res.render('admin/add-category', {
        title: 'Add Category',
        admin: req.session.admin,
        category: null,
        errors: null
    });
};

// Add category
exports.addCategory = async (req, res) => {
    try {
        const { name, description, status } = req.body;

        // Check existing
        const existingCategory = await Category.findOne({ 
            name: { $regex: new RegExp(`^${name}, 'i') },
            isDeleted: false 
        });

        if (existingCategory) {
            return res.render('admin/add-category', {
                title: 'Add Category',
                admin: req.session.admin,
                category: { name, description, status },
                errors: { name: 'Category with this name already exists' }
            });
        }

        // Create category
        const category = new Category({
            name: name.trim(),
            description: description?.trim() || '',
            status: status === 'active'
        });

        await category.save();

        res.redirect('/admin/categories?success=Category added successfully');

    } catch (error) {
        console.error('Add category error:', error);
        res.render('admin/add-category', {
            title: 'Add Category',
            admin: req.session.admin,
            category: req.body,
            errors: { general: 'Error adding category. Please try again.' }
        });
    }
};

// Edit category form
exports.editCategoryForm = async (req, res) => {
    try {
        const { categoryId } = req.params;
        const category = await Category.findById(categoryId);

        if (!category || category.isDeleted) {
            return res.redirect('/admin/categories?error=Category not found');
        }

        res.render('admin/edit-category', {
            title: 'Edit Category',
            admin: req.session.admin,
            category,
            errors: null
        });

    } catch (error) {
        console.error('Edit category form error:', error);
        res.redirect('/admin/categories?error=Error loading category');
    }
};

// Update category
exports.updateCategory = async (req, res) => {
    try {
        const { categoryId } = req.params;
        const { name, description, status } = req.body;

        // Check existing
        const existingCategory = await Category.findOne({ 
            name: { $regex: new RegExp(`^${name}, 'i') },
            isDeleted: false,
            _id: { $ne: categoryId }
        });

        if (existingCategory) {
            const category = await Category.findById(categoryId);
            return res.render('admin/edit-category', {
                title: 'Edit Category',
                admin: req.session.admin,
                category: { ...category.toObject(), name, description, status },
                errors: { name: 'Category with this name already exists' }
            });
        }

        // Update category
        await Category.findByIdAndUpdate(categoryId, {
            name: name.trim(),
            description: description?.trim() || '',
            status: status === 'active',
            updatedAt: new Date()
        });

        res.redirect('/admin/categories?success=Category updated successfully');

    } catch (error) {
        console.error('Update category error:', error);
        res.redirect('/admin/categories?error=Error updating category');
    }
};

// Delete category
exports.deleteCategory = async (req, res) => {
    try {
        const { categoryId } = req.params;

        await Category.findByIdAndUpdate(categoryId, {
            isDeleted: true,
            deletedAt: new Date()
        });

        res.json({ 
            success: true, 
            message: 'Category deleted successfully' 
        });

    } catch (error) {
        console.error('Delete category error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error deleting category' 
        });
    }
};