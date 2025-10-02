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
exports.CarwashStation = exports.CarwashOrder = exports.CarwashService = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const CarwashServiceSchema = new mongoose_1.Schema({
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
const CarwashOrderSchema = new mongoose_1.Schema({
    orderNumber: {
        type: String,
        required: true,
        unique: true
    },
    customer: {
        type: mongoose_1.Schema.Types.ObjectId,
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
                type: mongoose_1.Schema.Types.ObjectId,
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
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'User'
        }],
    currentEmployee: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User'
    },
    createdBy: {
        type: mongoose_1.Schema.Types.ObjectId,
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
                type: mongoose_1.Schema.Types.ObjectId,
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
            type: mongoose_1.Schema.Types.ObjectId,
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
                    type: mongoose_1.Schema.Types.ObjectId,
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
const CarwashStationSchema = new mongoose_1.Schema({
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
        type: mongoose_1.Schema.Types.ObjectId,
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
CarwashOrderSchema.pre('save', async function (next) {
    if (this.isNew && !this.orderNumber) {
        const date = new Date();
        const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
        const timeStr = date.toTimeString().slice(0, 8).replace(/:/g, '');
        const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        this.orderNumber = `CW-${dateStr}-${timeStr}-${randomNum}`;
    }
    next();
});
CarwashOrderSchema.virtual('totalDuration').get(function () {
    return this.services.reduce((total, service) => {
        return total;
    }, 0);
});
CarwashOrderSchema.virtual('completionTime').get(function () {
    if (this.actualCompletionTime && this.actualStartTime) {
        return this.actualCompletionTime.getTime() - this.actualStartTime.getTime();
    }
    return null;
});
exports.CarwashService = mongoose_1.default.model('CarwashService', CarwashServiceSchema);
exports.CarwashOrder = mongoose_1.default.model('CarwashOrder', CarwashOrderSchema);
exports.CarwashStation = mongoose_1.default.model('CarwashStation', CarwashStationSchema);
//# sourceMappingURL=Carwash.js.map