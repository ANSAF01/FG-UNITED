const User = require('../../models/User');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');

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

//show signup page
exports.signupForm = (req,res)=>{
    res.render('users/signup',{title:'sign Up', errors: null});
};
    
exports.signupUser = async(req,res)=>{
    try{
        const {fullname,email,mobile,password,confirmPassword,referralCode } = req.body;

        // Validation
        const errors = {};
        if (!fullname?.trim()) errors.fullname = 'Full name is required';
        if (!email?.trim()) errors.email = 'Email is required';
        if (!mobile?.trim()) errors.mobile = 'Mobile number is required';
        if (!password) errors.password = 'Password is required';
        if (password !== confirmPassword) errors.confirmPassword = 'Passwords do not match';

        // Check if user already exists
        const existingUser = await User.findOne({ 
            $or: [{ email }, { mobile }] 
        });
        if (existingUser) {
            if (existingUser.email === email) errors.email = 'Email already registered';
            if (existingUser.mobile === mobile) errors.mobile = 'Mobile number already registered';
        }

        if (Object.keys(errors).length > 0) {
            return res.render('users/signup', {
                title: 'Sign Up',
                errors,
                formData: req.body
            });
        }

        // Generate OTP and store user data in session
        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        req.session.pendingUser = {
            fullname: fullname.trim(),
            email: email.trim().toLowerCase(),
            mobile: mobile.trim(),
            password: await bcrypt.hash(password, 10),
            referralCode: referralCode?.trim() || null,
            otp,
            otpExpiry
        };

        // Send OTP email
        await sendOTPEmail(email, otp);

        res.redirect(`/otp?email=${encodeURIComponent(email)}`);

    } catch(err){
        console.error('Signup error:', err);
        res.render('users/signup', {
            title: 'Sign Up',
            errors: { general: 'Error creating account. Please try again.' },
            formData: req.body
        });
    }
};

//show login page
exports.loginForm = (req,res)=>{
        res.render('users/login',{title:'Login'});
};

exports.loginUser = async(req,res)=>{
    try{
      const {email, password} = req.body;

      //find user by email
      const user = await User.findOne({email})
      if(!user) return res.status(400).send('Invalid credentials');

      // Blocked user check
      if (user.isBlocked) {
        return res.status(403).render('users/login', { title: 'Login', message: 'Your account has been blocked. Contact support.' });
      }

      //check password
      const isMatch = await bcrypt.compare(password,user.password);
      if(!isMatch) return res.status(400).send('Invalid credentials');
      
      //store user session
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

// logout user
exports.logoutUser = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).send('Error logging out');
        }
        res.redirect('/');
    });
};