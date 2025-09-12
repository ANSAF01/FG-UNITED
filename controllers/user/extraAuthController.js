const User = require('../../models/User');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Email transporter setup
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Generate OTP
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP email
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

// Send password reset email
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

exports.verifyOtp = async (req, res) => {
    try {
        const { otp } = req.body;
        const pendingUser = req.session.pendingUser;

        if (!pendingUser) {
            return res.redirect('/signup');
        }

        // Check if OTP is expired
        if (new Date() > new Date(pendingUser.otpExpiry)) {
            return res.render('users/otp', {
                title: 'Verify OTP',
                email: pendingUser.email,
                message: '',
                errors: { otp: 'OTP has expired. Please request a new one.' }
            });
        }

        // Verify OTP
        if (otp !== pendingUser.otp) {
            return res.render('users/otp', {
                title: 'Verify OTP',
                email: pendingUser.email,
                message: '',
                errors: { otp: 'Invalid OTP. Please try again.' }
            });
        }

        // Create user
        const user = new User({
            fullname: pendingUser.fullname,
            email: pendingUser.email,
            mobile: pendingUser.mobile,
            password: pendingUser.password,
            referralCode: pendingUser.referralCode
        });

        await user.save();

        // Clear pending user from session
        delete req.session.pendingUser;

        // Auto login
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

exports.resendOtp = async (req, res) => {
    try {
        const pendingUser = req.session.pendingUser;

        if (!pendingUser) {
            return res.redirect('/signup');
        }

        // Generate new OTP
        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Update session
        req.session.pendingUser.otp = otp;
        req.session.pendingUser.otpExpiry = otpExpiry;

        // Send new OTP
        await sendOTPEmail(pendingUser.email, otp);

        res.redirect(`/otp?email=${encodeURIComponent(pendingUser.email)}&message=New OTP sent successfully`);

    } catch (error) {
        console.error('Resend OTP error:', error);
        res.redirect(`/otp?email=${encodeURIComponent(req.session.pendingUser?.email || '')}&message=Error sending OTP. Please try again.`);
    }
};

exports.forgotPasswordForm = (req, res) => {
    res.render('users/forgot-password', { 
        title: 'Forgot Password', 
        message: '',
        errors: null 
    });
};

exports.forgotPasswordSubmit = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email?.trim()) {
            return res.render('users/forgot-password', {
                title: 'Forgot Password',
                message: '',
                errors: { email: 'Email is required' }
            });
        }

        const user = await User.findOne({ email: email.trim().toLowerCase() });

        // Always show success message for security
        const successMessage = 'If an account exists with this email, a reset link has been sent.';

        if (user) {
            // Generate reset token
            const resetToken = crypto.randomBytes(32).toString('hex');
            const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

            // Store reset token in session (in production, store in database)
            req.session.resetTokens = req.session.resetTokens || {};
            req.session.resetTokens[resetToken] = {
                userId: user._id,
                expiry: resetTokenExpiry
            };

            // Send reset email
            await sendResetEmail(email, resetToken);
        }

        res.render('users/forgot-password', {
            title: 'Forgot Password',
            message: successMessage,
            errors: null
        });

    } catch (error) {
        console.error('Forgot password error:', error);
        res.render('users/forgot-password', {
            title: 'Forgot Password',
            message: '',
            errors: { general: 'Error processing request. Please try again.' }
        });
    }
};

exports.resetPasswordForm = (req, res) => {
    const token = req.query.token || '';
    
    if (!token) {
        return res.redirect('/forgot-password');
    }

    // Check if token exists and is valid
    const resetTokens = req.session.resetTokens || {};
    const tokenData = resetTokens[token];

    if (!tokenData || new Date() > new Date(tokenData.expiry)) {
        return res.render('users/reset-password', {
            title: 'Reset Password',
            token: '',
            message: '',
            errors: { token: 'Invalid or expired reset token' }
        });
    }

    res.render('users/reset-password', { 
        title: 'Reset Password', 
        token, 
        message: '',
        errors: null 
    });
};

exports.resetPasswordSubmit = async (req, res) => {
    try {
        const { token, password, confirmPassword } = req.body;

        // Validation
        const errors = {};
        if (!password) errors.password = 'Password is required';
        if (!confirmPassword) errors.confirmPassword = 'Confirm password is required';
        if (password !== confirmPassword) errors.confirmPassword = 'Passwords do not match';
        if (password && password.length < 6) errors.password = 'Password must be at least 6 characters';

        if (Object.keys(errors).length > 0) {
            return res.render('users/reset-password', {
                title: 'Reset Password',
                token,
                message: '',
                errors
            });
        }

        // Check token
        const resetTokens = req.session.resetTokens || {};
        const tokenData = resetTokens[token];

        if (!tokenData || new Date() > new Date(tokenData.expiry)) {
            return res.render('users/reset-password', {
                title: 'Reset Password',
                token: '',
                message: '',
                errors: { token: 'Invalid or expired reset token' }
            });
        }

        // Update password
        const hashedPassword = await bcrypt.hash(password, 10);
        await User.findByIdAndUpdate(tokenData.userId, { password: hashedPassword });

        // Clear token
        delete req.session.resetTokens[token];

        res.redirect('/login?message=Password reset successfully');

    } catch (error) {
        console.error('Reset password error:', error);
        res.render('users/reset-password', {
            title: 'Reset Password',
            token: req.body.token || '',
            message: '',
            errors: { general: 'Error resetting password. Please try again.' }
        });
    }
};

exports.profilePage = (req, res) => {
  // TODO: fetch user from session; for UI, render placeholder
  res.render('users/profile', { title: 'Your Profile', user: req.session?.user || null });
};

exports.aboutPage = (req, res) => {
  res.render('about', { title: 'About' });
};
