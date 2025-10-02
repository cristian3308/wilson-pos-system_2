"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authValidator = exports.validateUpdateUserRole = exports.validateResetPassword = exports.validateForgotPassword = exports.validateChangePassword = exports.validateUpdateProfile = exports.validateLogin = void 0;
const joi_1 = __importDefault(require("joi"));
const validateRegister = (data) => {
    const schema = joi_1.default.object({
        firstName: joi_1.default.string()
            .min(2)
            .max(50)
            .required()
            .messages({
            'string.empty': 'First name is required',
            'string.min': 'First name must be at least 2 characters',
            'string.max': 'First name cannot exceed 50 characters'
        }),
        lastName: joi_1.default.string()
            .min(2)
            .max(50)
            .required()
            .messages({
            'string.empty': 'Last name is required',
            'string.min': 'Last name must be at least 2 characters',
            'string.max': 'Last name cannot exceed 50 characters'
        }),
        email: joi_1.default.string()
            .email()
            .required()
            .messages({
            'string.empty': 'Email is required',
            'string.email': 'Please enter a valid email address'
        }),
        password: joi_1.default.string()
            .min(8)
            .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])'))
            .required()
            .messages({
            'string.empty': 'Password is required',
            'string.min': 'Password must be at least 8 characters',
            'string.pattern.base': 'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'
        }),
        confirmPassword: joi_1.default.string()
            .valid(joi_1.default.ref('password'))
            .required()
            .messages({
            'any.only': 'Passwords do not match',
            'string.empty': 'Confirm password is required'
        }),
        phone: joi_1.default.string()
            .pattern(/^\+?[1-9]\d{1,14}$/)
            .optional()
            .messages({
            'string.pattern.base': 'Please enter a valid phone number'
        }),
        role: joi_1.default.string()
            .valid('customer', 'employee', 'manager', 'admin')
            .default('customer')
            .optional()
    });
    return schema.validate(data, { abortEarly: false });
};
const validateLogin = (data) => {
    const schema = joi_1.default.object({
        email: joi_1.default.string()
            .email()
            .required()
            .messages({
            'string.empty': 'Email is required',
            'string.email': 'Please enter a valid email address'
        }),
        password: joi_1.default.string()
            .required()
            .messages({
            'string.empty': 'Password is required'
        })
    });
    return schema.validate(data, { abortEarly: false });
};
exports.validateLogin = validateLogin;
const validateUpdateProfile = (data) => {
    const schema = joi_1.default.object({
        firstName: joi_1.default.string()
            .min(2)
            .max(50)
            .optional()
            .messages({
            'string.min': 'First name must be at least 2 characters',
            'string.max': 'First name cannot exceed 50 characters'
        }),
        lastName: joi_1.default.string()
            .min(2)
            .max(50)
            .optional()
            .messages({
            'string.min': 'Last name must be at least 2 characters',
            'string.max': 'Last name cannot exceed 50 characters'
        }),
        phone: joi_1.default.string()
            .pattern(/^\+?[1-9]\d{1,14}$/)
            .optional()
            .messages({
            'string.pattern.base': 'Please enter a valid phone number'
        }),
        avatar: joi_1.default.string()
            .uri()
            .optional()
            .messages({
            'string.uri': 'Avatar must be a valid URL'
        })
    });
    return schema.validate(data, { abortEarly: false });
};
exports.validateUpdateProfile = validateUpdateProfile;
const validateChangePassword = (data) => {
    const schema = joi_1.default.object({
        currentPassword: joi_1.default.string()
            .required()
            .messages({
            'string.empty': 'Current password is required'
        }),
        newPassword: joi_1.default.string()
            .min(8)
            .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])'))
            .required()
            .messages({
            'string.empty': 'New password is required',
            'string.min': 'New password must be at least 8 characters',
            'string.pattern.base': 'New password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'
        }),
        confirmPassword: joi_1.default.string()
            .valid(joi_1.default.ref('newPassword'))
            .required()
            .messages({
            'any.only': 'Passwords do not match',
            'string.empty': 'Confirm password is required'
        })
    });
    return schema.validate(data, { abortEarly: false });
};
exports.validateChangePassword = validateChangePassword;
const validateForgotPassword = (data) => {
    const schema = joi_1.default.object({
        email: joi_1.default.string()
            .email()
            .required()
            .messages({
            'string.empty': 'Email is required',
            'string.email': 'Please enter a valid email address'
        })
    });
    return schema.validate(data, { abortEarly: false });
};
exports.validateForgotPassword = validateForgotPassword;
const validateResetPassword = (data) => {
    const schema = joi_1.default.object({
        token: joi_1.default.string()
            .required()
            .messages({
            'string.empty': 'Reset token is required'
        }),
        password: joi_1.default.string()
            .min(8)
            .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])'))
            .required()
            .messages({
            'string.empty': 'Password is required',
            'string.min': 'Password must be at least 8 characters',
            'string.pattern.base': 'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'
        }),
        confirmPassword: joi_1.default.string()
            .valid(joi_1.default.ref('password'))
            .required()
            .messages({
            'any.only': 'Passwords do not match',
            'string.empty': 'Confirm password is required'
        })
    });
    return schema.validate(data, { abortEarly: false });
};
exports.validateResetPassword = validateResetPassword;
const validateUpdateUserRole = (data) => {
    const schema = joi_1.default.object({
        role: joi_1.default.string()
            .valid('customer', 'employee', 'manager', 'admin')
            .required()
            .messages({
            'string.empty': 'Role is required',
            'any.only': 'Invalid role specified'
        }),
        permissions: joi_1.default.array()
            .items(joi_1.default.string())
            .optional()
            .messages({
            'array.base': 'Permissions must be an array of strings'
        })
    });
    return schema.validate(data, { abortEarly: false });
};
exports.validateUpdateUserRole = validateUpdateUserRole;
const validateMiddleware = (validationFn) => {
    return (req, res, next) => {
        const { error } = validationFn(req.body);
        if (error) {
            res.status(400).json({
                message: 'Validation error',
                errors: error.details.map((detail) => detail.message)
            });
            return;
        }
        next();
    };
};
exports.authValidator = {
    register: validateMiddleware(validateRegister),
    login: validateMiddleware(exports.validateLogin),
    updateProfile: validateMiddleware(exports.validateUpdateProfile),
    changePassword: validateMiddleware(exports.validateChangePassword)
};
//# sourceMappingURL=authValidator.js.map