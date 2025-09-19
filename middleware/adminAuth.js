// Admin auth middleware
const requireAdminAuth = (req, res, next) => {
    if (!req.session.admin) {
        return res.redirect('/admin/login');
    }
    next();
};

// Redirect if logged in
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