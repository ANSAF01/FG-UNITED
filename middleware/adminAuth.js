// Admin authentication middleware
const requireAdminAuth = (req, res, next) => {
    if (!req.session.admin) {
        return res.redirect('/admin/login');
    }
    next();
};

// Check if admin is already logged in
const redirectIfLoggedIn = (req, res, next) => {
    if (req.session.admin) {
        return res.redirect('/admin');
    }
    next();
};

module.exports = {
    requireAdminAuth,
    redirectIfLoggedIn
};