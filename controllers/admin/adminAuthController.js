  const User = require('../../models/User');
  const bcrypt = require('bcrypt');

  // Admin login form
  exports.loginForm = (req, res) => {
    res.render('admin/login', { 
      title: 'Admin Login',
      message: null 
    });
  };

  // Admin login
  exports.loginAdmin = async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).render('admin/login', { 
          title: 'Admin Login', 
          message: 'Email and password are required.' 
        });
      }

      // Find admin
      const admin = await User.findOne({ email, role: 'admin' });
      if (!admin) {
        return res.status(400).render('admin/login', { 
          title: 'Admin Login', 
          message: 'Invalid credentials.' 
        });
      }

      // Check password
      const isMatch = await admin.comparePassword(password);
      if (!isMatch) {
        return res.status(400).render('admin/login', { 
          title: 'Admin Login', 
          message: 'Invalid credentials.' 
        });
      }

      // Set session
      req.session.admin = {
        _id: admin._id,
        email: admin.email,
        name: admin.fullname,
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
