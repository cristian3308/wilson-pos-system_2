import { Schema, model, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'manager' | 'employee' | 'customer';
  avatar?: string;
  phone?: string;
  isActive: boolean;
  isEmailVerified: boolean;
  permissions: string[];
  lastLogin?: Date;
  refreshToken?: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  getFullName(): string;
}

const UserSchema = new Schema<IUser>({
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
    select: false // Don't include password in queries by default
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
    transform: function(doc: any, ret: any) {
      delete ret.password;
      delete ret.refreshToken;
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes for performance
UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ isActive: 1 });
UserSchema.index({ createdAt: -1 });

// Pre-save middleware to hash password
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Method to compare password
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to get full name
UserSchema.methods.getFullName = function(): string {
  return `${this.firstName} ${this.lastName}`;
};

// Set default permissions based on role
UserSchema.pre('save', function(next) {
  if (!this.isModified('role')) return next();
  
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

export default model<IUser>('User', UserSchema);