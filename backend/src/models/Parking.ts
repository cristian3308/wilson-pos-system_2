import mongoose, { Document, Schema } from 'mongoose';

export interface IParkingSpot extends Document {
  spotNumber: string;
  level: number;
  zone: string;
  type: 'regular' | 'premium' | 'disabled' | 'electric';
  isOccupied: boolean;
  isReserved: boolean;
  currentVehicle?: mongoose.Types.ObjectId;
  dimensions: {
    length: number;
    width: number;
  };
  hourlyRate: number;
  dailyRate: number;
  monthlyRate: number;
  status: 'active' | 'maintenance' | 'blocked';
  sensors: {
    hasMotionSensor: boolean;
    hasCameraCoverage: boolean;
    lastSensorUpdate?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface IParkingTicket extends Document {
  ticketNumber: string;
  vehicle: {
    licensePlate: string;
    brand: string;
    model: string;
    color: string;
    type: 'car' | 'motorcycle' | 'truck' | 'van';
  };
  parkingSpot: mongoose.Types.ObjectId;
  customer?: mongoose.Types.ObjectId;
  employee: mongoose.Types.ObjectId;
  entryTime: Date;
  exitTime?: Date;
  estimatedExitTime?: Date;
  duration?: number; // in minutes
  pricing: {
    hourlyRate: number;
    totalHours: number;
    subtotal: number;
    tax: number;
    discount: number;
    total: number;
  };
  payment: {
    method: 'cash' | 'card' | 'digital' | 'monthly_pass';
    status: 'pending' | 'paid' | 'refunded';
    transactionId?: string;
    paidAt?: Date;
  };
  barcode: string;
  qrCode: string;
  status: 'active' | 'completed' | 'cancelled';
  observations?: string;
  images: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Parking Spot Schema
const ParkingSpotSchema = new Schema<IParkingSpot>({
  spotNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  level: {
    type: Number,
    required: true,
    min: 0
  },
  zone: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['regular', 'premium', 'disabled', 'electric'],
    default: 'regular'
  },
  isOccupied: {
    type: Boolean,
    default: false
  },
  isReserved: {
    type: Boolean,
    default: false
  },
  currentVehicle: {
    type: Schema.Types.ObjectId,
    ref: 'ParkingTicket'
  },
  dimensions: {
    length: {
      type: Number,
      required: true,
      min: 0
    },
    width: {
      type: Number,
      required: true,
      min: 0
    }
  },
  hourlyRate: {
    type: Number,
    required: true,
    min: 0
  },
  dailyRate: {
    type: Number,
    required: true,
    min: 0
  },
  monthlyRate: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['active', 'maintenance', 'blocked'],
    default: 'active'
  },
  sensors: {
    hasMotionSensor: {
      type: Boolean,
      default: false
    },
    hasCameraCoverage: {
      type: Boolean,
      default: false
    },
    lastSensorUpdate: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Parking Ticket Schema
const ParkingTicketSchema = new Schema<IParkingTicket>({
  ticketNumber: {
    type: String,
    required: true,
    unique: true
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
      enum: ['car', 'motorcycle', 'truck', 'van'],
      default: 'car'
    }
  },
  parkingSpot: {
    type: Schema.Types.ObjectId,
    ref: 'ParkingSpot',
    required: true
  },
  customer: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  employee: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  entryTime: {
    type: Date,
    required: true,
    default: Date.now
  },
  exitTime: Date,
  estimatedExitTime: Date,
  duration: Number,
  pricing: {
    hourlyRate: {
      type: Number,
      required: true,
      min: 0
    },
    totalHours: {
      type: Number,
      min: 0
    },
    subtotal: {
      type: Number,
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
    total: {
      type: Number,
      min: 0
    }
  },
  payment: {
    method: {
      type: String,
      enum: ['cash', 'card', 'digital', 'monthly_pass'],
      default: 'cash'
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'refunded'],
      default: 'pending'
    },
    transactionId: String,
    paidAt: Date
  },
  barcode: {
    type: String,
    required: true
  },
  qrCode: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled'],
    default: 'active'
  },
  observations: String,
  images: [String]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
ParkingSpotSchema.index({ spotNumber: 1 });
ParkingSpotSchema.index({ level: 1, zone: 1 });
ParkingSpotSchema.index({ type: 1 });
ParkingSpotSchema.index({ isOccupied: 1 });
ParkingSpotSchema.index({ status: 1 });

ParkingTicketSchema.index({ ticketNumber: 1 });
ParkingTicketSchema.index({ 'vehicle.licensePlate': 1 });
ParkingTicketSchema.index({ parkingSpot: 1 });
ParkingTicketSchema.index({ customer: 1 });
ParkingTicketSchema.index({ employee: 1 });
ParkingTicketSchema.index({ entryTime: 1 });
ParkingTicketSchema.index({ status: 1 });
ParkingTicketSchema.index({ 'payment.status': 1 });

// Virtual for occupied time
ParkingTicketSchema.virtual('occupiedTime').get(function() {
  const endTime = this.exitTime || new Date();
  return Math.ceil((endTime.getTime() - this.entryTime.getTime()) / (1000 * 60)); // minutes
});

// Pre-save middleware to generate ticket number
ParkingTicketSchema.pre('save', async function(next) {
  if (this.isNew && !this.ticketNumber) {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const timeStr = date.toTimeString().slice(0, 8).replace(/:/g, '');
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.ticketNumber = `PKG-${dateStr}-${timeStr}-${randomNum}`;
  }
  next();
});

export const ParkingSpot = mongoose.model<IParkingSpot>('ParkingSpot', ParkingSpotSchema);
export const ParkingTicket = mongoose.model<IParkingTicket>('ParkingTicket', ParkingTicketSchema);