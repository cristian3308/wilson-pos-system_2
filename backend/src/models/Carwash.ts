import mongoose, { Document, Schema } from 'mongoose';

export interface ICarwashService extends Document {
  name: string;
  description: string;
  category: 'basic' | 'premium' | 'deluxe' | 'special';
  basePrice: number;
  duration: number; // in minutes
  isActive: boolean;
  requirements: string[];
  includes: string[];
  vehicleTypes: string[];
  images: string[];
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICarwashOrder extends Document {
  orderNumber: string;
  customer?: mongoose.Types.ObjectId;
  vehicle: {
    licensePlate: string;
    brand: string;
    model: string;
    color: string;
    type: 'car' | 'motorcycle' | 'truck' | 'van' | 'suv';
    size: 'small' | 'medium' | 'large' | 'extra-large';
  };
  services: Array<{
    service: mongoose.Types.ObjectId;
    price: number;
    customizations?: string[];
    notes?: string;
  }>;
  assignedEmployees: mongoose.Types.ObjectId[];
  currentEmployee?: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  pricing: {
    subtotal: number;
    tax: number;
    discount: number;
    tip: number;
    total: number;
  };
  payment: {
    method: 'cash' | 'card' | 'digital' | 'credit';
    status: 'pending' | 'paid' | 'refunded' | 'partial';
    transactions: Array<{
      amount: number;
      method: string;
      transactionId?: string;
      timestamp: Date;
    }>;
  };
  timeline: Array<{
    status: string;
    timestamp: Date;
    employee?: mongoose.Types.ObjectId;
    notes?: string;
    images?: string[];
  }>;
  status: 'pending' | 'in-progress' | 'washing' | 'drying' | 'quality-check' | 'completed' | 'cancelled';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  estimatedStartTime?: Date;
  estimatedCompletionTime?: Date;
  actualStartTime?: Date;
  actualCompletionTime?: Date;
  queuePosition?: number;
  location: {
    bay?: number;
    station?: string;
  };
  beforeImages: string[];
  afterImages: string[];
  customerFeedback?: {
    rating: number;
    comment?: string;
    submittedAt: Date;
  };
  qualityCheck: {
    passed: boolean;
    checkedBy?: mongoose.Types.ObjectId;
    checkedAt?: Date;
    issues?: string[];
    notes?: string;
  };
  commission: {
    totalAmount: number;
    distribution: Array<{
      employee: mongoose.Types.ObjectId;
      amount: number;
      percentage: number;
    }>;
  };
  notifications: Array<{
    type: 'sms' | 'email' | 'push';
    recipient: string;
    message: string;
    sentAt: Date;
    status: 'sent' | 'delivered' | 'failed';
  }>;
  observations?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICarwashStation extends Document {
  name: string;
  type: 'wash' | 'dry' | 'detail' | 'quality';
  isActive: boolean;
  isOccupied: boolean;
  currentOrder?: mongoose.Types.ObjectId;
  capacity: number;
  equipment: Array<{
    name: string;
    status: 'working' | 'maintenance' | 'broken';
    lastMaintenance?: Date;
  }>;
  location: {
    building: string;
    floor: number;
    area: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Carwash Service Schema
const CarwashServiceSchema = new Schema<ICarwashService>({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    maxlength: 500
  },
  category: {
    type: String,
    enum: ['basic', 'premium', 'deluxe', 'special'],
    required: true
  },
  basePrice: {
    type: Number,
    required: true,
    min: 0
  },
  duration: {
    type: Number,
    required: true,
    min: 5
  },
  isActive: {
    type: Boolean,
    default: true
  },
  requirements: [String],
  includes: [String],
  vehicleTypes: [String],
  images: [String],
  order: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Carwash Order Schema
const CarwashOrderSchema = new Schema<ICarwashOrder>({
  orderNumber: {
    type: String,
    required: true,
    unique: true
  },
  customer: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  vehicle: {
    licensePlate: {
      type: String,
      required: true,
      uppercase: true,
      trim: true
    },
    brand: {
      type: String,
      required: true,
      trim: true
    },
    model: {
      type: String,
      required: true,
      trim: true
    },
    color: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: ['car', 'motorcycle', 'truck', 'van', 'suv'],
      default: 'car'
    },
    size: {
      type: String,
      enum: ['small', 'medium', 'large', 'extra-large'],
      default: 'medium'
    }
  },
  services: [{
    service: {
      type: Schema.Types.ObjectId,
      ref: 'CarwashService',
      required: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    customizations: [String],
    notes: String
  }],
  assignedEmployees: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  currentEmployee: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  pricing: {
    subtotal: {
      type: Number,
      required: true,
      min: 0
    },
    tax: {
      type: Number,
      min: 0,
      default: 0
    },
    discount: {
      type: Number,
      min: 0,
      default: 0
    },
    tip: {
      type: Number,
      min: 0,
      default: 0
    },
    total: {
      type: Number,
      required: true,
      min: 0
    }
  },
  payment: {
    method: {
      type: String,
      enum: ['cash', 'card', 'digital', 'credit'],
      default: 'cash'
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'refunded', 'partial'],
      default: 'pending'
    },
    transactions: [{
      amount: {
        type: Number,
        required: true,
        min: 0
      },
      method: {
        type: String,
        required: true
      },
      transactionId: String,
      timestamp: {
        type: Date,
        default: Date.now
      }
    }]
  },
  timeline: [{
    status: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    employee: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    notes: String,
    images: [String]
  }],
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'washing', 'drying', 'quality-check', 'completed', 'cancelled'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  estimatedStartTime: Date,
  estimatedCompletionTime: Date,
  actualStartTime: Date,
  actualCompletionTime: Date,
  queuePosition: Number,
  location: {
    bay: Number,
    station: String
  },
  beforeImages: [String],
  afterImages: [String],
  customerFeedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    submittedAt: Date
  },
  qualityCheck: {
    passed: {
      type: Boolean,
      default: false
    },
    checkedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    checkedAt: Date,
    issues: [String],
    notes: String
  },
  commission: {
    totalAmount: {
      type: Number,
      default: 0
    },
    distribution: [{
      employee: {
        type: Schema.Types.ObjectId,
        ref: 'User'
      },
      amount: Number,
      percentage: Number
    }]
  },
  notifications: [{
    type: {
      type: String,
      enum: ['sms', 'email', 'push']
    },
    recipient: String,
    message: String,
    sentAt: Date,
    status: {
      type: String,
      enum: ['sent', 'delivered', 'failed']
    }
  }],
  observations: String
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Carwash Station Schema
const CarwashStationSchema = new Schema<ICarwashStation>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['wash', 'dry', 'detail', 'quality'],
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isOccupied: {
    type: Boolean,
    default: false
  },
  currentOrder: {
    type: Schema.Types.ObjectId,
    ref: 'CarwashOrder'
  },
  capacity: {
    type: Number,
    required: true,
    min: 1
  },
  equipment: [{
    name: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['working', 'maintenance', 'broken'],
      default: 'working'
    },
    lastMaintenance: Date
  }],
  location: {
    building: String,
    floor: Number,
    area: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
CarwashServiceSchema.index({ category: 1 });
CarwashServiceSchema.index({ isActive: 1 });
CarwashServiceSchema.index({ order: 1 });

CarwashOrderSchema.index({ orderNumber: 1 });
CarwashOrderSchema.index({ 'vehicle.licensePlate': 1 });
CarwashOrderSchema.index({ customer: 1 });
CarwashOrderSchema.index({ assignedEmployees: 1 });
CarwashOrderSchema.index({ status: 1 });
CarwashOrderSchema.index({ priority: 1 });
CarwashOrderSchema.index({ createdAt: 1 });
CarwashOrderSchema.index({ estimatedStartTime: 1 });

CarwashStationSchema.index({ type: 1 });
CarwashStationSchema.index({ isActive: 1 });
CarwashStationSchema.index({ isOccupied: 1 });

// Pre-save middleware to generate order number
CarwashOrderSchema.pre('save', async function(next) {
  if (this.isNew && !this.orderNumber) {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const timeStr = date.toTimeString().slice(0, 8).replace(/:/g, '');
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.orderNumber = `CW-${dateStr}-${timeStr}-${randomNum}`;
  }
  next();
});

// Virtual for total duration
CarwashOrderSchema.virtual('totalDuration').get(function() {
  return this.services.reduce((total: number, service: any) => {
    // This would need to be populated to get the actual duration
    return total;
  }, 0);
});

// Virtual for service completion time
CarwashOrderSchema.virtual('completionTime').get(function() {
  if (this.actualCompletionTime && this.actualStartTime) {
    return this.actualCompletionTime.getTime() - this.actualStartTime.getTime();
  }
  return null;
});

export const CarwashService = mongoose.model<ICarwashService>('CarwashService', CarwashServiceSchema);
export const CarwashOrder = mongoose.model<ICarwashOrder>('CarwashOrder', CarwashOrderSchema);
export const CarwashStation = mongoose.model<ICarwashStation>('CarwashStation', CarwashStationSchema);