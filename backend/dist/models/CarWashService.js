"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const CarWashServiceSchema = new mongoose_1.Schema({
    serviceNumber: {
        type: String,
        required: [true, 'Service number is required'],
        unique: true,
        trim: true,
        uppercase: true
    },
    customer: {
        name: {
            type: String,
            required: [true, 'Customer name is required'],
            trim: true
        },
        phone: {
            type: String,
            required: [true, 'Customer phone is required'],
            trim: true
        },
        email: {
            type: String,
            trim: true,
            lowercase: true
        },
        loyaltyPoints: {
            type: Number,
            default: 0,
            min: 0
        }
    },
    vehicle: {
        licensePlate: {
            type: String,
            required: [true, 'License plate is required'],
            trim: true,
            uppercase: true
        },
        model: {
            type: String,
            required: [true, 'Vehicle model is required'],
            trim: true
        },
        color: {
            type: String,
            required: [true, 'Vehicle color is required'],
            trim: true
        },
        year: {
            type: Number,
            min: [1900, 'Invalid year'],
            max: [new Date().getFullYear() + 1, 'Invalid year']
        },
        type: {
            type: String,
            enum: ['sedan', 'suv', 'truck', 'motorcycle', 'van', 'coupe'],
            required: true
        }
    },
    services: [{
            type: {
                type: String,
                enum: ['basic_wash', 'premium_wash', 'detail_wash', 'wax', 'interior_clean', 'engine_clean'],
                required: true
            },
            name: {
                type: String,
                required: true,
                trim: true
            },
            price: {
                type: Number,
                required: true,
                min: [0, 'Price cannot be negative']
            },
            duration: {
                type: Number,
                required: true,
                min: [1, 'Duration must be positive']
            },
            description: {
                type: String,
                trim: true
            }
        }],
    assignedEmployee: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Employee assignment is required']
    },
    status: {
        type: String,
        enum: ['pending', 'in_progress', 'quality_check', 'completed', 'cancelled'],
        default: 'pending',
        required: true
    },
    priority: {
        type: String,
        enum: ['low', 'normal', 'high', 'urgent'],
        default: 'normal',
        required: true
    },
    queuePosition: {
        type: Number,
        required: true,
        min: [1, 'Queue position must be positive']
    },
    startTime: {
        type: Date,
        default: null
    },
    endTime: {
        type: Date,
        default: null
    },
    estimatedDuration: {
        type: Number,
        required: true,
        min: [1, 'Estimated duration must be positive']
    },
    totalPrice: {
        type: Number,
        required: true,
        min: [0, 'Total price cannot be negative']
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'refunded'],
        default: 'pending',
        required: true
    },
    paymentMethod: {
        type: String,
        enum: ['cash', 'card', 'digital', 'loyalty_points'],
        default: null
    },
    beforePhotos: [{
            type: String,
            validate: {
                validator: function (v) {
                    return /^https?:\/\/.+\.(jpg|jpeg|png|gif)$/i.test(v);
                },
                message: 'Invalid image URL format'
            }
        }],
    afterPhotos: [{
            type: String,
            validate: {
                validator: function (v) {
                    return /^https?:\/\/.+\.(jpg|jpeg|png|gif)$/i.test(v);
                },
                message: 'Invalid image URL format'
            }
        }],
    qualityRating: {
        type: Number,
        min: [1, 'Rating must be between 1 and 5'],
        max: [5, 'Rating must be between 1 and 5'],
        default: null
    },
    customerFeedback: {
        type: String,
        trim: true,
        maxlength: [1000, 'Feedback cannot exceed 1000 characters']
    },
    notes: {
        type: String,
        trim: true,
        maxlength: [500, 'Notes cannot exceed 500 characters']
    },
    promotions: [{
            code: {
                type: String,
                trim: true,
                uppercase: true
            },
            discount: {
                type: Number,
                min: [0, 'Discount cannot be negative']
            },
            type: {
                type: String,
                enum: ['percentage', 'fixed'],
                required: true
            }
        }],
    isActive: {
        type: Boolean,
        default: true
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
CarWashServiceSchema.index({ serviceNumber: 1 });
CarWashServiceSchema.index({ status: 1 });
CarWashServiceSchema.index({ assignedEmployee: 1 });
CarWashServiceSchema.index({ 'vehicle.licensePlate': 1 });
CarWashServiceSchema.index({ 'customer.phone': 1 });
CarWashServiceSchema.index({ queuePosition: 1 });
CarWashServiceSchema.index({ priority: 1, queuePosition: 1 });
CarWashServiceSchema.index({ createdAt: -1 });
CarWashServiceSchema.index({ startTime: 1 });
CarWashServiceSchema.index({ endTime: 1 });
CarWashServiceSchema.virtual('actualDuration').get(function () {
    if (this.startTime && this.endTime) {
        return Math.round((this.endTime.getTime() - this.startTime.getTime()) / (1000 * 60));
    }
    return null;
});
exports.default = (0, mongoose_1.model)('CarWashService', CarWashServiceSchema);
//# sourceMappingURL=CarWashService.js.map