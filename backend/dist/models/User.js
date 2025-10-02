"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const UserSchema = new mongoose_1.Schema({
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [8, 'Password must be at least 8 characters'],
        select: false
    },
    firstName: {
        type: String,
        required: [true, 'First name is required'],
        trim: true,
        maxlength: [50, 'First name cannot exceed 50 characters']
    },
    lastName: {
        type: String,
        required: [true, 'Last name is required'],
        trim: true,
        maxlength: [50, 'Last name cannot exceed 50 characters']
    },
    role: {
        type: String,
        enum: ['admin', 'manager', 'employee', 'customer'],
        default: 'customer',
        required: true
    },
    avatar: {
        type: String,
        default: null
    },
    phone: {
        type: String,
        trim: true,
        match: [/^\+?[\d\s\-\(\)]+$/, 'Please enter a valid phone number']
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    permissions: [{
            type: String,
            enum: [
                'dashboard:read',
                'parking:read', 'parking:write', 'parking:delete',
                'carwash:read', 'carwash:write', 'carwash:delete',
                'users:read', 'users:write', 'users:delete',
                'reports:read', 'reports:write',
                'settings:read', 'settings:write'
            ]
        }],
    lastLogin: {
        type: Date,
        default: null
    },
    refreshToken: {
        type: String,
        select: false
    }
}, {
    timestamps: true,
    toJSON: {
        transform: function (doc, ret) {
            delete ret.password;
            delete ret.refreshToken;
            delete ret.__v;
            return ret;
        }
    }
});
UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ isActive: 1 });
UserSchema.index({ createdAt: -1 });
UserSchema.pre('save', async function (next) {
    if (!this.isModified('password'))
        return next();
    try {
        const salt = await bcryptjs_1.default.genSalt(12);
        this.password = await bcryptjs_1.default.hash(this.password, salt);
        next();
    }
    catch (error) {
        next(error);
    }
});
UserSchema.methods.comparePassword = async function (candidatePassword) {
    return bcryptjs_1.default.compare(candidatePassword, this.password);
};
UserSchema.methods.getFullName = function () {
    return `${this.firstName} ${this.lastName}`;
};
UserSchema.pre('save', function (next) {
    if (!this.isModified('role'))
        return next();
    switch (this.role) {
        case 'admin':
            this.permissions = [
                'dashboard:read',
                'parking:read', 'parking:write', 'parking:delete',
                'carwash:read', 'carwash:write', 'carwash:delete',
                'users:read', 'users:write', 'users:delete',
                'reports:read', 'reports:write',
                'settings:read', 'settings:write'
            ];
            break;
        case 'manager':
            this.permissions = [
                'dashboard:read',
                'parking:read', 'parking:write',
                'carwash:read', 'carwash:write',
                'users:read',
                'reports:read', 'reports:write'
            ];
            break;
        case 'employee':
            this.permissions = [
                'dashboard:read',
                'parking:read', 'parking:write',
                'carwash:read', 'carwash:write'
            ];
            break;
        case 'customer':
            this.permissions = ['dashboard:read'];
            break;
    }
    next();
});
exports.default = (0, mongoose_1.model)('User', UserSchema);
//# sourceMappingURL=User.js.map