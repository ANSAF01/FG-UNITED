const User = require('../../models/User');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const { validationResult } = require('express-validator');

// Email setup
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// OTP generation
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP
const sendOTPEmail = async (email, otp) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Your OTP for FG United',
        html: `
            <h2>Your OTP Code</h2>
            <p>Your OTP code is: <strong>${otp}</strong></p>
            <p>This code will expire in 10 minutes.</p>
            <p>If you didn't request this, please ignore this email.</p>
        `
    };
    
    await transporter.sendMail(mailOptions);
};

// Send reset email
const sendResetEmail = async (email, token) => {
    const resetUrl = `${process.env.BASE_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
    
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Password Reset - FG United',
        html: `
            <h2>Password Reset Request</h2>
            <p>You requested a password reset. Click the link below to reset your password:</p>
            <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
            <p>This link will expire in 1 hour.</p>
              <p>If you didn't request this, please ignore this email.</p>
        `
    };
    
    await transporter.sendMail(mailOptions);
};

// Signup form
exports.signupForm = (req,res)=>{
    res.render('users/signup',{title:'sign Up', errors: {}, formData: {}});
};
    
// User signup
exports.signupUser = async(req,res)=>{
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.render('users/signup', {
            title: 'Sign Up',
            errors: errors.mapped(),
            formData: req.body
        });
    }

    try{
        const {fullname,email,mobile,password,referralCode } = req.body;

        const existingUser = await User.findOne({ 
            $or: [{ email }, { mobile }] 
        });
        if (existingUser) {
            const errors = {};
            if (existingUser.email === email) {
                errors.email = { msg: 'Email already registered' };
            }
            if (existingUser.mobile === mobile) {
                errors.mobile = { msg: 'Mobile number already registered' };
            }
            return res.render('users/signup', {
                title: 'Sign Up',
                errors,
                formData: req.body
            });
        }

        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // fr nw expiry of otp is 10 min.
        req.session.pendingUser = {
            fullname: fullname.trim(),
            email: email.trim().toLowerCase(),
            mobile: mobile.trim(),
            password: await bcrypt.hash(password, 10),
            referralCode: referralCode?.trim() || null,
            otp,
            otpExpiry
        };

        await sendOTPEmail(email, otp);

        res.redirect(`/otp?email=${encodeURIComponent(email)}`);

    } catch(err){
        console.error('Signup error:', err);
        res.render('users/signup', {
            title: 'Sign Up',
            errors: { general: { msg: 'Error creating account. Please try again.' } },
            formData: req.body
        });
    }
};

// Login form
exports.loginForm = (req,res)=>{
        res.render('users/login',{title:'Login', errors: {}, formData: {}});
};

// User login
exports.loginUser = async(req,res)=>{
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.render('users/login', {
            title: 'Login',
            errors: errors.mapped(),
            formData: req.body
        });
    }

    try{
      const {email, password} = req.body;

      const user = await User.findOne({email})
      if(!user) {
          return res.render('users/login', {
              title: 'Login',
              errors: { general: { msg: 'Invalid credentials' } },
              formData: req.body
          });
      }

      if (user.isBlocked) {
        return res.render('users/login', { 
            title: 'Login', 
            errors: { general: { msg: 'Your account has been blocked. Contact support.' } }, 
            formData: req.body 
        });
      }

      const isMatch = await bcrypt.compare(password,user.password);
      if(!isMatch) {
        return res.render('users/login', {
            title: 'Login',
            errors: { general: { msg: 'Invalid credentials' } },
            formData: req.body
        });
      }
      
      req.session.userId = user._id;
      req.session.user = {
        _id: user._id,
        fullname: user.fullname,
        email: user.email,
        role: user.role
      };

      res.redirect('/')
    } catch (err)
    {
        res.status(500).send('Error logging in: '+err.message);
    }
};

// User logout
exports.logoutUser = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).send('Error logging out');
        }
        res.redirect('/');
    });
};

// OTP form
exports.otpForm = (req, res) => {
    const email = req.query.email || '';
    const message = req.query.message || '';
    
    if (!req.session.pendingUser) {
        return res.redirect('/signup');
    }
    
    res.render('users/otp', { 
        title: 'Verify OTP', 
        email, 
        message,
        errors: null 
    });
};

// Verify OTP
exports.verifyOtp = async (req, res) => {
    try {
        const { otp } = req.body;
        const pendingUser = req.session.pendingUser;

        if (!pendingUser) {
            return res.redirect('/signup');
        }

        if (new Date() > new Date(pendingUser.otpExpiry)) {
            return res.render('users/otp', {
                title: 'Verify OTP',
                email: pendingUser.email,
                message: '',
                errors: {otp: 'OTP has expired. Please request a new one.' }
            });
        }

        if (otp !== pendingUser.otp) {
            return res.render('users/otp', {
                title: 'Verify OTP',
                email: pendingUser.email,
                message: '',
                errors: {otp: 'Invalid OTP. Please try again.' }
            });
        }

        const user = new User({
            fullname: pendingUser.fullname,
            email: pendingUser.email,
            mobile: pendingUser.mobile,
            password: pendingUser.password,
            referralCode: pendingUser.referralCode
        });

        await user.save();

        delete req.session.pendingUser;

        req.session.userId = user._id;
        req.session.user = {
            _id: user._id,
            fullname: user.fullname,
            email: user.email,
            role: user.role
        };

        res.redirect('/');

    } catch (error) {
        console.error('OTP verification error:', error);
        res.render('users/otp', {
            title: 'Verify OTP',
            email: req.session.pendingUser?.email || '',
            message: '',
            errors: { general: 'Error verifying OTP. Please try again.' }
        });
    }
};

// Resend OTP
exports.resendOtp = async (req, res) => {
    try {
        const pendingUser = req.session.pendingUser;

        if (!pendingUser) {
            return res.redirect('/signup');
        }

        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        req.session.pendingUser.otp = otp;
        req.session.pendingUser.otpExpiry = otpExpiry;

        await sendOTPEmail(pendingUser.email, otp);

        res.redirect(`/otp?email=${encodeURIComponent(pendingUser.email)}&message=New OTP sent successfully`);

    } catch (error) {
        console.error('Resend OTP error:', error);
        res.redirect(`/otp?email=${encodeURIComponent(req.session.pendingUser?.email || '')}&message=Error sending OTP. Please try again.`);
    }
};

// Forgot password form
exports.forgotPasswordForm = (req, res) => {
    res.render('users/forgot-password', { 
        title: 'Forgot Password', 
        message: '',
        errors: {},
        formData: {}
    });
};

// Forgot password submit
exports.forgotPasswordSubmit = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.render('users/forgot-password', {
            title: 'Forgot Password',
            errors: errors.mapped(),
            formData: req.body,
            message: ''
        });
    }

    try {
        const { email } = req.body;
        const user = await User.findOne({ email: email.trim().toLowerCase() });

        if (user) {
            const otp = generateOTP();
            const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

            req.session.passwordReset = {
                email: user.email,
                otp,
                otpExpiry
            };

            await sendOTPEmail(user.email, otp);
        }

        res.redirect('/verify-password-reset-otp');

    } catch (error) {
        console.error('Forgot password error:', error);
        res.render('users/forgot-password', {
            title: 'Forgot Password',
            message: '',
            errors: { general: { msg: 'Error processing request. Please try again.' } },
            formData: req.body
        });
    }
};

// Reset password form
exports.resetPasswordForm = (req, res) => {
    if (!req.session.passwordReset || !req.session.passwordReset.verified) {
        return res.redirect('/forgot-password');
    }

    res.render('users/reset-password', { 
        title: 'Reset Password', 
        errors: {},
        formData: {}
    });
};

// Reset password submit
exports.resetPasswordSubmit = async (req, res) => {
    if (!req.session.passwordReset || !req.session.passwordReset.verified) {
        return res.redirect('/forgot-password');
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.render('users/reset-password', {
            title: 'Reset Password',
            errors: errors.mapped(),
            formData: req.body
        });
    }

    try {
        const { password } = req.body;
        const userEmail = req.session.passwordReset.email;

        const user = await User.findOne({ email: userEmail });
        if (!user) {
            return res.render('users/reset-password', {
                title: 'Reset Password',
                errors: { general: { msg: 'User not found.' } },
                formData: req.body
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        user.password = hashedPassword;
        await user.save();

        delete req.session.passwordReset;

        res.redirect('/login?message=Password reset successfully');

    } catch (error) {
        console.error('Reset password error:', error);
        res.render('users/reset-password', {
            title: 'Reset Password',
            errors: { general: { msg: 'Error resetting password. Please try again.' } },
            formData: req.body
        });
    }
};

// Profile page
exports.profilePage = (req, res) => {
  res.render('users/profile', { 
    title: 'Your Profile', 
    user: req.session?.user || null,
    active: 'profile' 
  });
};

// About page
exports.aboutPage = (req, res) => {
  res.render('about', { title: 'About' });
};

// Verify OTP form
exports.verifyPasswordResetOtpForm = (req, res) => {
    res.render('users/verify-password-reset-otp', {
        title: 'Verify OTP',
        message: '',
        errors: {},
    });
};

// Verify OTP
exports.verifyPasswordResetOtp = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.render('users/verify-password-reset-otp', {
            title: 'Verify OTP',
            errors: errors.mapped(),
            message: ''
        });
    }

    try {
        const { otp } = req.body;
        const passwordReset = req.session.passwordReset;

        if (!passwordReset) {
            return res.redirect('/forgot-password');
        }

        if (new Date() > new Date(passwordReset.otpExpiry)) {
            return res.render('users/verify-password-reset-otp', {
                title: 'Verify OTP',
                errors: { otp: { msg: 'OTP has expired. Please request a new one.' } },
                message: ''
            });
        }

        if (otp !== passwordReset.otp) {
            return res.render('users/verify-password-reset-otp', {
                title: 'Verify OTP',
                errors: { otp: { msg: 'Invalid OTP. Please try again.' } },
                message: ''
            });
        }

        req.session.passwordReset.verified = true;
        res.redirect('/reset-password');

    } catch (error) {
        console.error('Verify password reset OTP error:', error);
        res.render('users/verify-password-reset-otp', {
            title: 'Verify OTP',
            errors: { general: { msg: 'Error verifying OTP. Please try again.' } },
            message: ''
        });
    }
};
