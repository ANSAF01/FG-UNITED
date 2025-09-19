const { body } = require('express-validator');

const signupValidationRules = () => {
  return [
    // Full name
    body('fullname')
      .notEmpty().withMessage('Full name is required')
      .matches(/^[A-Za-z\s]+$/).withMessage('Full name can only contain letters and spaces')
      .custom(value => {
        if (value.trim().length === 0) {
          throw new Error('Full name cannot be empty.');
        }
        if (!value.trim().includes(' ')) {
          throw new Error('Please enter both first and last name.');
        }
        return true;
      }),

    // Email
    body('email').isEmail().withMessage('Please enter a valid email'),

    // Mobile
    body('mobile').matches(/^[5-9]\d{9}$/).withMessage('Please enter a valid 10-digit mobile number'),

    // Password
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),

    // Confirm password
    body('confirmPassword').custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),
  ];
};

const loginValidationRules = () => {
  return [
    // Email
    body('email').isEmail().withMessage('Please enter a valid email'),

    // Password
    body('password').notEmpty().withMessage('Password is required'),
  ];
};

const forgotPasswordValidationRules = () => {
  return [
    // Email
    body('email').isEmail().withMessage('Please enter a valid email'),
  ];
};

const otpValidationRules = () => {
  return [
    // OTP
    body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
  ];
};

module.exports = {
  signupValidationRules,
  loginValidationRules,
  forgotPasswordValidationRules,
  otpValidationRules,
};
