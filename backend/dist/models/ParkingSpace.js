"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const ParkingSpaceSchema = new mongoose_1.Schema({
    spaceNumber: {
        type: String,
        required: [true, 'Space number is required'],
        unique: true,
        trim: true,
        uppercase: true
    },
    floor: {
        type: Number,
        required: [true, 'Floor is required'],
        min: [0, 'Floor cannot be negative']
    },
    section: {
        type: String,
        required: [true, 'Section is required'],
        trim: true,
        uppercase: true
    },
    type: {
        type: String,
        enum: ['regular', 'compact', 'handicapped', 'electric', 'motorcycle'],
        default: 'regular',
        required: true
    },
    status: {
        type: String,
        enum: ['available', 'occupied', 'reserved', 'maintenance'],
        default: 'available',
        required: true
    },
    vehicle: {
        licensePlate: {
            type: String,
            trim: true,
            uppercase: true
        },
        model: {
            type: String,
            trim: true
        },
        color: {
            type: String,
            trim: true
        },
        owner: {
            name: {
                type: String,
                trim: true
            },
            phone: {
                type: String,
                trim: true
            },
            email: {
                type: String,
                trim: true,
                lowercase: true
            }
        }
    },
    entryTime: {
        type: Date,
        default: null
    },
    exitTime: {
        type: Date,
        default: null
    },
    reservedUntil: {
        type: Date,
        default: null
    },
    qrCode: {
        type: String,
        required: true,
        unique: true
    },
    barcode: {
        type: String,
        required: true,
        unique: true
    },
    hourlyRate: {
        type: Number,
        required: [true, 'Hourly rate is required'],
        min: [0, 'Hourly rate cannot be negative']
    },
    features: [{
            type: String,
            enum: ['covered', 'security_camera', 'electric_charging', 'car_wash_nearby', 'wide_space', 'valet_service']
        }],
    dimensions: {
        length: {
            type: Number,
            required: true,
            min: [1, 'Length must be positive']
        },
        width: {
            type: Number,
            required: true,
            min: [1, 'Width must be positive']
        }
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastMaintenance: {
        type: Date,
        default: null
    }
}, {
    timestamps: true,
    toJSON: {
        transform: function (doc, ret) {
            delete ret.__v;
            return ret;
        }
    }
});
ParkingSpaceSchema.index({ spaceNumber: 1 });
ParkingSpaceSchema.index({ status: 1 });
ParkingSpaceSchema.index({ floor: 1, section: 1 });
ParkingSpaceSchema.index({ type: 1 });
ParkingSpaceSchema.index({ 'vehicle.licensePlate': 1 });
ParkingSpaceSchema.index({ qrCode: 1 });
ParkingSpaceSchema.index({ barcode: 1 });
ParkingSpaceSchema.index({ createdAt: -1 });
exports.default = (0, mongoose_1.model)('ParkingSpace', ParkingSpaceSchema);
//# sourceMappingURL=ParkingSpace.js.map