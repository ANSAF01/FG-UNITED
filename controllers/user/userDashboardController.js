// Middleware to check if user is authenticated
const requireAuth = (req, res, next) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    next();
};


// Cart page
exports.cartPage = [requireAuth, (req, res) => {
    res.render('users/cart', { 
        title: 'Shopping Cart',
        user: req.session.user,
        cartItems: sampleCartItems // This will be populated from database later
    });
}];

// Wishlist page
exports.wishlistPage = [requireAuth, (req, res) => {
    res.render('users/wishlist', { 
        title: 'My Wishlist',
        user: req.session.user,
        wishlistItems: sampleWishlistItems // This will be populated from database later
    });
}];

// Orders page
exports.ordersPage = [requireAuth, (req, res) => {
    res.render('users/orders', { 
        title: 'My Orders',
        user: req.session.user,
        orders: sampleOrders // This will be populated from database later
    });
}];

// Addresses page
exports.addressesPage = [requireAuth, (req, res) => {
    res.render('users/addresses', { 
        title: 'My Addresses',
        user: req.session.user,
        addresses: sampleAddresses // This will be populated from database later
    });
}];

// Settings page
exports.settingsPage = [requireAuth, (req, res) => {
    res.render('users/settings', { 
        title: 'Account Settings',
        user: req.session.user
    });
}];