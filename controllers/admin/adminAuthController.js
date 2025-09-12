const Admin = require('../../models/Admin');
const bcrypt = require('bcrypt');

// Admin login form
exports.loginForm = (req, res) => {
  res.render('admin/login', { 
    title: 'Admin Login',
    message: null 
  });
};

// Admin login authentication
exports.loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).render('admin/login', { 
        title: 'Admin Login', 
        message: 'Email and password are required.' 
      });
    }

    // Find admin by email
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(400).render('admin/login', { 
        title: 'Admin Login', 
        message: 'Invalid credentials.' 
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(400).render('admin/login', { 
        title: 'Admin Login', 
        message: 'Invalid credentials.' 
      });
    }

    // Set admin session
    req.session.admin = {
      _id: admin._id,
      email: admin.email,
      name: admin.name,
      role: admin.role
    };

    return res.redirect('/admin');
  } catch (err) {
    console.error('Admin login error:', err);
    return res.status(500).render('admin/login', { 
      title: 'Admin Login', 
      message: 'Login failed. Please try again.' 
    });
  }
};

// Admin dashboard
exports.dashboard = (req, res) => {
  res.render('admin/dashboard', { 
    title: 'Admin Dashboard',
    admin: req.session.admin 
  });
};

// Admin logout
exports.logoutAdmin = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Admin logout error:', err);
      return res.status(500).send('Error logging out');
    }
    res.redirect('/admin/login');
  });
};
