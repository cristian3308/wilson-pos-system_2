import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';

const validateRegister = (data: any) => {
  const schema = Joi.object({
    firstName: Joi.string()
      .min(2)
      .max(50)
      .required()
      .messages({
        'string.empty': 'First name is required',
        'string.min': 'First name must be at least 2 characters',
        'string.max': 'First name cannot exceed 50 characters'
      }),
    
    lastName: Joi.string()
      .min(2)
      .max(50)
      .required()
      .messages({
        'string.empty': 'Last name is required',
        'string.min': 'Last name must be at least 2 characters',
        'string.max': 'Last name cannot exceed 50 characters'
      }),
    
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.empty': 'Email is required',
        'string.email': 'Please enter a valid email address'
      }),
    
    password: Joi.string()
      .min(8)
      .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])'))
      .required()
      .messages({
        'string.empty': 'Password is required',
        'string.min': 'Password must be at least 8 characters',
        'string.pattern.base': 'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'
      }),
    
    confirmPassword: Joi.string()
      .valid(Joi.ref('password'))
      .required()
      .messages({
        'any.only': 'Passwords do not match',
        'string.empty': 'Confirm password is required'
      }),
    
    phone: Joi.string()
      .pattern(/^\+?[1-9]\d{1,14}$/)
      .optional()
      .messages({
        'string.pattern.base': 'Please enter a valid phone number'
      }),
    
    role: Joi.string()
      .valid('customer', 'employee', 'manager', 'admin')
      .default('customer')
      .optional()
  });

  return schema.validate(data, { abortEarly: false });
};

export const validateLogin = (data: any) => {
  const schema = Joi.object({
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.empty': 'Email is required',
        'string.email': 'Please enter a valid email address'
      }),
    
    password: Joi.string()
      .required()
      .messages({
        'string.empty': 'Password is required'
      })
  });

  return schema.validate(data, { abortEarly: false });
};

export const validateUpdateProfile = (data: any) => {
  const schema = Joi.object({
    firstName: Joi.string()
      .min(2)
      .max(50)
      .optional()
      .messages({
        'string.min': 'First name must be at least 2 characters',
        'string.max': 'First name cannot exceed 50 characters'
      }),
    
    lastName: Joi.string()
      .min(2)
      .max(50)
      .optional()
      .messages({
        'string.min': 'Last name must be at least 2 characters',
        'string.max': 'Last name cannot exceed 50 characters'
      }),
    
    phone: Joi.string()
      .pattern(/^\+?[1-9]\d{1,14}$/)
      .optional()
      .messages({
        'string.pattern.base': 'Please enter a valid phone number'
      }),
    
    avatar: Joi.string()
      .uri()
      .optional()
      .messages({
        'string.uri': 'Avatar must be a valid URL'
      })
  });

  return schema.validate(data, { abortEarly: false });
};

export const validateChangePassword = (data: any) => {
  const schema = Joi.object({
    currentPassword: Joi.string()
      .required()
      .messages({
        'string.empty': 'Current password is required'
      }),
    
    newPassword: Joi.string()
      .min(8)
      .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])'))
      .required()
      .messages({
        'string.empty': 'New password is required',
        'string.min': 'New password must be at least 8 characters',
        'string.pattern.base': 'New password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'
      }),
    
    confirmPassword: Joi.string()
      .valid(Joi.ref('newPassword'))
      .required()
      .messages({
        'any.only': 'Passwords do not match',
        'string.empty': 'Confirm password is required'
      })
  });

  return schema.validate(data, { abortEarly: false });
};

export const validateForgotPassword = (data: any) => {
  const schema = Joi.object({
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.empty': 'Email is required',
        'string.email': 'Please enter a valid email address'
      })
  });

  return schema.validate(data, { abortEarly: false });
};

export const validateResetPassword = (data: any) => {
  const schema = Joi.object({
    token: Joi.string()
      .required()
      .messages({
        'string.empty': 'Reset token is required'
      }),
    
    password: Joi.string()
      .min(8)
      .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])'))
      .required()
      .messages({
        'string.empty': 'Password is required',
        'string.min': 'Password must be at least 8 characters',
        'string.pattern.base': 'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'
      }),
    
    confirmPassword: Joi.string()
      .valid(Joi.ref('password'))
      .required()
      .messages({
        'any.only': 'Passwords do not match',
        'string.empty': 'Confirm password is required'
      })
  });

  return schema.validate(data, { abortEarly: false });
};

export const validateUpdateUserRole = (data: any) => {
  const schema = Joi.object({
    role: Joi.string()
      .valid('customer', 'employee', 'manager', 'admin')
      .required()
      .messages({
        'string.empty': 'Role is required',
        'any.only': 'Invalid role specified'
      }),
    
    permissions: Joi.array()
      .items(Joi.string())
      .optional()
      .messages({
        'array.base': 'Permissions must be an array of strings'
      })
  });

  return schema.validate(data, { abortEarly: false });
};

// Express middleware functions
const validateMiddleware = (validationFn: any) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = validationFn(req.body);
    if (error) {
      res.status(400).json({
        message: 'Validation error',
        errors: error.details.map((detail: any) => detail.message)
      });
      return;
    }
    next();
  };
};

export const authValidator = {
  register: validateMiddleware(validateRegister),
  login: validateMiddleware(validateLogin),
  updateProfile: validateMiddleware(validateUpdateProfile),
  changePassword: validateMiddleware(validateChangePassword)
};