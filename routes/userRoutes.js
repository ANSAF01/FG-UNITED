const express = require('express');
const passport = require('passport');
const userAuthController = require('../controllers/user/userAuthController');
const productController = require('../controllers/user/productController');

const router = express.Router();

// root route (home page)
router.get('/', productController.getHomepageProducts);

// auth routes
router.get('/signup', userAuthController.signupForm);
router.post('/signup', userAuthController.signupUser);
router.get('/login', userAuthController.loginForm);
router.post('/login', userAuthController.loginUser);
router.get('/logout', userAuthController.logoutUser);

// Google OAuth routes
router.get('/auth/google', 
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    (req, res) => {
        // Set session data for consistency
        req.session.userId = req.user._id;
        req.session.user = {
            _id: req.user._id,
            fullname: req.user.fullname,
            email: req.user.email,
            role: req.user.role
        };
        res.redirect('/');
    }
);

// shop listing & details (industry standard)
router.get('/shop', productController.listProducts);
router.get('/shop/:id', productController.productDetails);

// redirect old product routes to shop (for backward compatibility)
router.get('/products', (req, res) => res.redirect(301, '/shop'));
router.get('/product/:id', (req, res) => res.redirect(301, `/shop/${req.params.id}`));

// extra auth-related pages
const extraAuth = require('../controllers/user/extraAuthController');
router.get('/otp', extraAuth.otpForm);
router.post('/otp', extraAuth.verifyOtp);
router.post('/otp/resend', extraAuth.resendOtp);
router.get('/forgot-password', extraAuth.forgotPasswordForm);
router.post('/forgot-password', extraAuth.forgotPasswordSubmit);
router.get('/reset-password', extraAuth.resetPasswordForm);
router.post('/reset-password', extraAuth.resetPasswordSubmit);
router.get('/profile', extraAuth.profilePage);
router.get('/about', extraAuth.aboutPage);

// public pages
router.get('/shop', productController.listProducts);

// user dashboard routes (require authentication)
const userDashboard = require('../controllers/user/userDashboardController');
router.get('/cart', userDashboard.cartPage);
router.get('/wishlist', userDashboard.wishlistPage);
router.get('/orders', userDashboard.ordersPage);
router.get('/addresses', userDashboard.addressesPage);
router.get('/settings', userDashboard.settingsPage);

module.exports = router;