const express = require('express'); // express framework
const path = require('path');       // used for file path joining
const session = require('express-session'); // used to manage user session
const MongoStore = require('connect-mongo'); // store sessions in MongoDB
const  morgan = require('morgan');  // logger for HTTP requests
const mongoose = require('./config/db'); // MongoDB connection
const passport = require('./config/passport'); // Passport configuration
const adminRoutes = require('./routes/adminRoutes');

// create express app
const app = express();

// setting view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// request logging
app.use(morgan('dev'));

// to serve static files
app.use(express.static(path.join(__dirname, 'public')));

// middleware used to parse JSON (like API requests)
app.use(express.json());

// middleware to parse form submissions from HTML forms
app.use(express.urlencoded({ extended: true }));
  
// so the user needs to be logged in across all pages so we use sessions for it
app.use(
    session({
        secret: process.env.SESSION_SECRET, // it will take secret key from .env
        resave: false,
        saveUninitialized: false,
        store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }), // it will save sessions in MongoDB
        cookie: {
            maxAge: 1000 * 60 * 60, // 1 hour expiration
            httpOnly: true, // prevent client-side JS from accessing the cookie
        },
    })
);

// Initialize passport
app.use(passport.initialize());
app.use(passport.session());

// for making user available in all templates
app.use((req, res, next) => {
  res.locals.user = req.session.user || req.user || null;
  next();
});

// user routes
const userRoutes = require('./routes/userRoutes');
app.use('/', userRoutes);

// admin routes
app.use('/admin', adminRoutes);

// error handler
app.use((err, req, res, next) => {
    console.log(err.stack);
    res.status(500).send('Something went wrong');
});

// 404 handler
app.use((req, res) => {
    res.status(404).render('404', { title: 'Page not Found' });
});

module.exports = app;