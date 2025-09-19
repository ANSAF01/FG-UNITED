const express = require('express');
const passport = require('passport');
const userAuthController = require('../controllers/user/userAuthController');
const productController = require('../controllers/user/productController');
const { signupValidationRules, loginValidationRules, forgotPasswordValidationRules, otpValidationRules } = require('../middleware/validators/userAuthValidator');

const router = express.Router();

// Home page
router.get('/', productController.getHomepageProducts);

// Auth routes
router.get('/signup', userAuthController.signupForm);
router.post('/signup', signupValidationRules(), userAuthController.signupUser);
router.get('/login', userAuthController.loginForm);
router.post('/login', loginValidationRules(), userAuthController.loginUser);
router.get('/logout', userAuthController.logoutUser);

// Google OAuth
router.get('/auth/google', 
    passport.authenticate('google', { scope: ['profile', 'email'], prompt: 'select_account' })
);

router.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    (req, res) => {
        // Set session
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

// Shop listing & details
router.get('/shop', productController.listProducts);
router.get('/shop/:id', productController.productDetails);

// Redirect old product routes
router.get('/products', (req, res) => res.redirect(301, '/shop'));
router.get('/product/:id', (req, res) => res.redirect(301, `/shop/${req.params.id}`));

// Auth-related pages
router.get('/otp', userAuthController.otpForm);
router.post('/otp', userAuthController.verifyOtp);
router.post('/otp/resend', userAuthController.resendOtp);
router.get('/forgot-password', userAuthController.forgotPasswordForm);
router.post('/forgot-password', forgotPasswordValidationRules(), userAuthController.forgotPasswordSubmit);
router.get('/verify-password-reset-otp', userAuthController.verifyPasswordResetOtpForm);
router.post('/verify-password-reset-otp', otpValidationRules(), userAuthController.verifyPasswordResetOtp);
router.get('/reset-password', userAuthController.resetPasswordForm);
router.post('/reset-password', userAuthController.resetPasswordSubmit);
router.get('/profile', userAuthController.profilePage);
router.get('/about', userAuthController.aboutPage);

// Public pages
router.get('/shop', productController.listProducts);

// User dashboard routes
const userDashboard = require('../controllers/user/userDashboardController');
router.get('/cart', userDashboard.cartPage);
router.get('/wishlist', userDashboard.wishlistPage);
router.get('/orders', userDashboard.ordersPage);
router.get('/addresses', userDashboard.addressesPage);
router.get('/settings', userDashboard.settingsPage);

module.exports = router;