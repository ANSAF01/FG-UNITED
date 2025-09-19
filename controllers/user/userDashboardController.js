// Auth middleware
const requireAuth = (req, res, next) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    next();
};

const comingSoon = (req, res, page) => {
    const pageTitles = {
        cart: 'Shopping Cart',
        wishlist: 'My Wishlist',
        orders: 'My Orders',
        addresses: 'My Addresses',
        settings: 'Account Settings'
    };
    res.render('coming-soon', {
        title: pageTitles[page] || 'Coming Soon',
        user: req.session.user,
        active: page
    });
}

// Cart page
exports.cartPage = [requireAuth, (req, res) => {
    comingSoon(req, res, 'cart');
}];

// Wishlist page
exports.wishlistPage = [requireAuth, (req, res) => {
    comingSoon(req, res, 'wishlist');
}];

// Orders page
exports.ordersPage = [requireAuth, (req, res) => {
    comingSoon(req, res, 'orders');
}];

// Addresses page
exports.addressesPage = [requireAuth, (req, res) => {
    comingSoon(req, res, 'addresses');
}];

// Settings page
exports.settingsPage = [requireAuth, (req, res) => {
    comingSoon(req, res, 'settings');
}];