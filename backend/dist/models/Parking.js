"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParkingTicket = exports.ParkingSpot = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const ParkingSpotSchema = new mongoose_1.Schema({
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
        type: mongoose_1.Schema.Types.ObjectId,
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
const ParkingTicketSchema = new mongoose_1.Schema({
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
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'ParkingSpot',
        required: true
    },
    customer: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User'
    },
    employee: {
        type: mongoose_1.Schema.Types.ObjectId,
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
ParkingTicketSchema.virtual('occupiedTime').get(function () {
    const endTime = this.exitTime || new Date();
    return Math.ceil((endTime.getTime() - this.entryTime.getTime()) / (1000 * 60));
});
ParkingTicketSchema.pre('save', async function (next) {
    if (this.isNew && !this.ticketNumber) {
        const date = new Date();
        const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
        const timeStr = date.toTimeString().slice(0, 8).replace(/:/g, '');
        const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        this.ticketNumber = `PKG-${dateStr}-${timeStr}-${randomNum}`;
    }
    next();
});
exports.ParkingSpot = mongoose_1.default.model('ParkingSpot', ParkingSpotSchema);
exports.ParkingTicket = mongoose_1.default.model('ParkingTicket', ParkingTicketSchema);
//# sourceMappingURL=Parking.js.map