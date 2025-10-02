"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Parking_1 = require("../models/Parking");
const qrcode_1 = __importDefault(require("qrcode"));
const bwip_js_1 = __importDefault(require("bwip-js"));
const logger_1 = __importDefault(require("../utils/logger"));
class ParkingService {
    async getAllSpots(filters) {
        try {
            const query = {};
            if (filters) {
                if (filters.level !== undefined)
                    query.level = filters.level;
                if (filters.zone)
                    query.zone = filters.zone;
                if (filters.type)
                    query.type = filters.type;
                if (filters.status)
                    query.status = filters.status;
                if (filters.isOccupied !== undefined)
                    query.isOccupied = filters.isOccupied;
            }
            const spots = await Parking_1.ParkingSpot.find(query).sort({ level: 1, spotNumber: 1 });
            return spots;
        }
        catch (error) {
            logger_1.default.error('Error fetching parking spots:', error);
            throw error;
        }
    }
    async getSpotById(spotId) {
        try {
            const spot = await Parking_1.ParkingSpot.findById(spotId);
            return spot;
        }
        catch (error) {
            logger_1.default.error(`Error fetching spot ${spotId}:`, error);
            throw error;
        }
    }
    async createSpot(spotData) {
        try {
            const spot = await Parking_1.ParkingSpot.create(spotData);
            logger_1.default.info(`Created parking spot: ${spot.spotNumber}`);
            return spot;
        }
        catch (error) {
            logger_1.default.error('Error creating parking spot:', error);
            throw error;
        }
    }
    async updateSpot(spotId, updateData) {
        try {
            const spot = await Parking_1.ParkingSpot.findByIdAndUpdate(spotId, updateData, { new: true, runValidators: true });
            if (spot) {
                logger_1.default.info(`Updated parking spot: ${spot.spotNumber}`);
            }
            return spot;
        }
        catch (error) {
            logger_1.default.error(`Error updating spot ${spotId}:`, error);
            throw error;
        }
    }
    async deleteSpot(spotId) {
        try {
            const result = await Parking_1.ParkingSpot.findByIdAndDelete(spotId);
            if (result) {
                logger_1.default.info(`Deleted parking spot: ${result.spotNumber}`);
                return true;
            }
            return false;
        }
        catch (error) {
            logger_1.default.error(`Error deleting spot ${spotId}:`, error);
            throw error;
        }
    }
    async createTicket(ticketData) {
        try {
            const spot = await Parking_1.ParkingSpot.findById(ticketData.parkingSpotId);
            if (!spot) {
                throw new Error('Parking spot not found');
            }
            if (spot.isOccupied) {
                throw new Error('Parking spot is already occupied');
            }
            const qrCodeData = JSON.stringify({
                ticketType: 'parking',
                licensePlate: ticketData.vehicle.licensePlate,
                timestamp: new Date().toISOString()
            });
            const qrCode = await qrcode_1.default.toDataURL(qrCodeData);
            const barcodeData = `PKG${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
            const barcode = await this.generateBarcode(barcodeData);
            const ticket = await Parking_1.ParkingTicket.create({
                ...ticketData,
                parkingSpot: ticketData.parkingSpotId,
                customer: ticketData.customerId,
                employee: ticketData.employeeId,
                pricing: {
                    hourlyRate: spot.hourlyRate,
                    totalHours: 0,
                    subtotal: 0,
                    tax: 0,
                    discount: 0,
                    total: 0
                },
                qrCode,
                barcode: barcodeData,
                status: 'active'
            });
            await Parking_1.ParkingSpot.findByIdAndUpdate(ticketData.parkingSpotId, {
                isOccupied: true,
                currentVehicle: ticket._id
            });
            logger_1.default.info(`Created parking ticket: ${ticket.ticketNumber} for ${ticketData.vehicle.licensePlate}`);
            return await Parking_1.ParkingTicket.findById(ticket._id)
                .populate('parkingSpot')
                .populate('customer', 'firstName lastName email phone')
                .populate('employee', 'firstName lastName');
        }
        catch (error) {
            logger_1.default.error('Error creating parking ticket:', error);
            throw error;
        }
    }
    async exitVehicle(ticketId, paymentData) {
        try {
            const ticket = await Parking_1.ParkingTicket.findById(ticketId);
            if (!ticket) {
                throw new Error('Ticket not found');
            }
            if (ticket.status !== 'active') {
                throw new Error('Ticket is not active');
            }
            const exitTime = new Date();
            const duration = Math.ceil((exitTime.getTime() - ticket.entryTime.getTime()) / (1000 * 60));
            const hours = Math.ceil(duration / 60);
            const subtotal = hours * ticket.pricing.hourlyRate;
            const tax = subtotal * 0.19;
            const total = subtotal + tax - ticket.pricing.discount;
            const updatedTicket = await Parking_1.ParkingTicket.findByIdAndUpdate(ticketId, {
                exitTime,
                duration,
                'pricing.totalHours': hours,
                'pricing.subtotal': subtotal,
                'pricing.tax': tax,
                'pricing.total': total,
                'payment.method': paymentData?.method || 'cash',
                'payment.status': 'paid',
                'payment.transactionId': paymentData?.transactionId,
                'payment.paidAt': new Date(),
                status: 'completed'
            }, { new: true }).populate('parkingSpot');
            if (updatedTicket) {
                await Parking_1.ParkingSpot.findByIdAndUpdate(updatedTicket.parkingSpot._id, {
                    isOccupied: false,
                    currentVehicle: null
                });
                logger_1.default.info(`Vehicle exited: ${updatedTicket.vehicle.licensePlate}, Duration: ${duration} minutes, Total: $${total}`);
            }
            return updatedTicket;
        }
        catch (error) {
            logger_1.default.error(`Error processing vehicle exit for ticket ${ticketId}:`, error);
            throw error;
        }
    }
    async getActiveTickets(filters) {
        try {
            const query = { status: 'active' };
            if (filters) {
                if (filters.licensePlate) {
                    query['vehicle.licensePlate'] = new RegExp(filters.licensePlate, 'i');
                }
                if (filters.customerId)
                    query.customer = filters.customerId;
                if (filters.employeeId)
                    query.employee = filters.employeeId;
                if (filters.spotId)
                    query.parkingSpot = filters.spotId;
            }
            const tickets = await Parking_1.ParkingTicket.find(query)
                .populate('parkingSpot')
                .populate('customer', 'firstName lastName email phone')
                .populate('employee', 'firstName lastName')
                .sort({ entryTime: -1 });
            return tickets;
        }
        catch (error) {
            logger_1.default.error('Error fetching active tickets:', error);
            throw error;
        }
    }
    async getTicketHistory(filters) {
        try {
            const query = {};
            if (filters) {
                if (filters.startDate || filters.endDate) {
                    query.entryTime = {};
                    if (filters.startDate)
                        query.entryTime.$gte = filters.startDate;
                    if (filters.endDate)
                        query.entryTime.$lte = filters.endDate;
                }
                if (filters.licensePlate) {
                    query['vehicle.licensePlate'] = new RegExp(filters.licensePlate, 'i');
                }
                if (filters.customerId)
                    query.customer = filters.customerId;
                if (filters.status)
                    query.status = filters.status;
            }
            const page = filters?.page || 1;
            const limit = filters?.limit || 20;
            const skip = (page - 1) * limit;
            const [tickets, totalCount] = await Promise.all([
                Parking_1.ParkingTicket.find(query)
                    .populate('parkingSpot')
                    .populate('customer', 'firstName lastName email phone')
                    .populate('employee', 'firstName lastName')
                    .sort({ entryTime: -1 })
                    .skip(skip)
                    .limit(limit),
                Parking_1.ParkingTicket.countDocuments(query)
            ]);
            return {
                tickets,
                totalCount,
                totalPages: Math.ceil(totalCount / limit),
                currentPage: page
            };
        }
        catch (error) {
            logger_1.default.error('Error fetching ticket history:', error);
            throw error;
        }
    }
    async getParkingMetrics(dateRange) {
        try {
            const [totalSpots, occupiedSpots] = await Promise.all([
                Parking_1.ParkingSpot.countDocuments({ status: 'active' }),
                Parking_1.ParkingSpot.countDocuments({ status: 'active', isOccupied: true })
            ]);
            const availableSpots = totalSpots - occupiedSpots;
            const occupancyRate = totalSpots > 0 ? (occupiedSpots / totalSpots) * 100 : 0;
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const thisWeekStart = new Date(today);
            thisWeekStart.setDate(today.getDate() - today.getDay());
            const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
            const [todayRevenue, weekRevenue, monthRevenue] = await Promise.all([
                this.calculateRevenue(today, new Date()),
                this.calculateRevenue(thisWeekStart, new Date()),
                this.calculateRevenue(thisMonthStart, new Date())
            ]);
            const avgStayTime = await this.calculateAverageStayTime(dateRange);
            const peakHours = await this.calculatePeakHours(dateRange);
            return {
                totalSpots,
                occupiedSpots,
                availableSpots,
                occupancyRate,
                revenue: {
                    today: todayRevenue,
                    thisWeek: weekRevenue,
                    thisMonth: monthRevenue
                },
                averageStayTime: avgStayTime,
                peakHours
            };
        }
        catch (error) {
            logger_1.default.error('Error calculating parking metrics:', error);
            throw error;
        }
    }
    async calculateRevenue(startDate, endDate) {
        const result = await Parking_1.ParkingTicket.aggregate([
            {
                $match: {
                    entryTime: { $gte: startDate, $lte: endDate },
                    'payment.status': 'paid'
                }
            },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$pricing.total' }
                }
            }
        ]);
        return result.length > 0 ? result[0].totalRevenue : 0;
    }
    async calculateAverageStayTime(dateRange) {
        const query = { status: 'completed', duration: { $exists: true } };
        if (dateRange) {
            query.entryTime = {
                $gte: dateRange.startDate,
                $lte: dateRange.endDate
            };
        }
        const result = await Parking_1.ParkingTicket.aggregate([
            { $match: query },
            {
                $group: {
                    _id: null,
                    avgDuration: { $avg: '$duration' }
                }
            }
        ]);
        return result.length > 0 ? Math.round(result[0].avgDuration) : 0;
    }
    async calculatePeakHours(dateRange) {
        const query = {};
        if (dateRange) {
            query.entryTime = {
                $gte: dateRange.startDate,
                $lte: dateRange.endDate
            };
        }
        const result = await Parking_1.ParkingTicket.aggregate([
            { $match: query },
            {
                $group: {
                    _id: { $hour: '$entryTime' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);
        const peakHours = Array.from({ length: 24 }, (_, hour) => {
            const hourData = result.find(r => r._id === hour);
            return {
                hour,
                occupancy: hourData ? hourData.count : 0
            };
        });
        return peakHours;
    }
    async generateBarcode(data) {
        try {
            const buffer = await bwip_js_1.default.toBuffer({
                bcid: 'code128',
                text: data,
                scale: 3,
                height: 10,
                includetext: true,
                textxalign: 'center'
            });
            return `data:image/png;base64,${buffer.toString('base64')}`;
        }
        catch (error) {
            logger_1.default.error('Error generating barcode:', error);
            return '';
        }
    }
    async findTicketByBarcode(barcode) {
        try {
            return await Parking_1.ParkingTicket.findOne({ barcode })
                .populate('parkingSpot')
                .populate('customer', 'firstName lastName email phone')
                .populate('employee', 'firstName lastName');
        }
        catch (error) {
            logger_1.default.error(`Error finding ticket by barcode ${barcode}:`, error);
            throw error;
        }
    }
    async findTicketByLicensePlate(licensePlate) {
        try {
            return await Parking_1.ParkingTicket.find({
                'vehicle.licensePlate': new RegExp(licensePlate, 'i'),
                status: 'active'
            })
                .populate('parkingSpot')
                .populate('customer', 'firstName lastName email phone')
                .populate('employee', 'firstName lastName');
        }
        catch (error) {
            logger_1.default.error(`Error finding tickets by license plate ${licensePlate}:`, error);
            throw error;
        }
    }
}
exports.default = new ParkingService();
//# sourceMappingURL=ParkingService.js.map