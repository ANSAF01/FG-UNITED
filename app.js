require('dotenv').config();
const express = require('express');
const path = require('path');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const  morgan = require('morgan');
const mongoose = require('./config/db');
const passport = require('./config/passport');
const adminRoutes = require('./routes/adminRoutes');

// Create app
const app = express();

// Port
const PORT = process.env.PORT || 3000;

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Request logging
app.use(morgan('dev'));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// JSON parsing
app.use(express.json());

// Form submissions
app.use(express.urlencoded({ extended: true }));
  
// Session setup
app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
        cookie: {
            maxAge: 1000 * 60 * 60, // 1 hour
            httpOnly: true,
        },
    })
);

// User locals
app.use((req, res, next) => {
  res.locals.user = req.session.user || req.user || null;
  next();
});

// User routes
const userRoutes = require('./routes/userRoutes');
app.use('/', userRoutes);

// Admin routes
app.use('/admin', adminRoutes);

// Error handler
app.use((err, req, res, next) => {
    console.log(err.stack);
    res.status(500).send('Something went wrong');
});

// 404 handler
app.use((req, res) => {
    res.status(404).render('404', { title: 'Page not Found' });
});


// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});