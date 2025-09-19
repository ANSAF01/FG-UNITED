const express = require('express');
const { loginForm, loginAdmin, dashboard, logoutAdmin } = require('../controllers/admin/adminAuthController');
const { requireAdminAuth, redirectIfLoggedIn } = require('../middleware/adminAuth');

// User Management
const { 
    userManagement, 
    blockUser, 
    unblockUser 
} = require('../controllers/admin/userManagementController');

// Category Management
const { 
    categoryManagement, 
    addCategoryForm, 
    addCategory, 
    editCategoryForm, 
    updateCategory, 
    deleteCategory 
} = require('../controllers/admin/categoryManagementController');

// Product Management
const { 
    productManagement, 
    addProductForm, 
    addProduct, 
    editProductForm, 
    updateProduct, 
    deleteProduct 
} = require('../controllers/admin/productManagementController');

const router = express.Router();

// Auth routes
router.get('/login', redirectIfLoggedIn, loginForm);
router.post('/login', loginAdmin);
router.get('/logout', logoutAdmin);

// Protected routes
router.use(requireAdminAuth);

// Dashboard
router.get('/', dashboard);

// User routes
router.get('/users', userManagement);
router.post('/users/:userId/block', blockUser);
router.post('/users/:userId/unblock', unblockUser);

// Category routes
router.get('/categories', categoryManagement);
router.get('/categories/add', addCategoryForm);
router.post('/categories/add', addCategory);
router.get('/categories/:categoryId/edit', editCategoryForm);
router.post('/categories/:categoryId/edit', updateCategory);
router.delete('/categories/:categoryId', deleteCategory);

// Product routes
router.get('/products', productManagement);
router.get('/products/add', addProductForm);
router.post('/products/add', addProduct);
router.get('/products/:productId/edit', editProductForm);
router.post('/products/:productId/edit', updateProduct);
router.delete('/products/:productId', deleteProduct);

module.exports = router;
