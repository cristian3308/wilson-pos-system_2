import { ParkingSpot, ParkingTicket, IParkingSpot, IParkingTicket } from '../models/Parking';
import QRCode from 'qrcode';
import bwipjs from 'bwip-js';
import logger from '../utils/logger';

export interface CreateTicketData {
  vehicle: {
    licensePlate: string;
    brand: string;
    model: string;
    color: string;
    type: 'car' | 'motorcycle' | 'truck' | 'van';
  };
  parkingSpotId: string;
  customerId?: string;
  employeeId: string;
  estimatedExitTime?: Date;
  observations?: string;
}

export interface ParkingMetrics {
  totalSpots: number;
  occupiedSpots: number;
  availableSpots: number;
  occupancyRate: number;
  revenue: {
    today: number;
    thisWeek: number;
    thisMonth: number;
  };
  averageStayTime: number;
  peakHours: Array<{
    hour: number;
    occupancy: number;
  }>;
}

class ParkingService {
  async getAllSpots(filters?: {
    level?: number;
    zone?: string;
    type?: string;
    status?: string;
    isOccupied?: boolean;
  }): Promise<IParkingSpot[]> {
    try {
      const query: any = {};
      
      if (filters) {
        if (filters.level !== undefined) query.level = filters.level;
        if (filters.zone) query.zone = filters.zone;
        if (filters.type) query.type = filters.type;
        if (filters.status) query.status = filters.status;
        if (filters.isOccupied !== undefined) query.isOccupied = filters.isOccupied;
      }

      const spots = await ParkingSpot.find(query).sort({ level: 1, spotNumber: 1 });
      return spots;
    } catch (error) {
      logger.error('Error fetching parking spots:', error);
      throw error;
    }
  }

  async getSpotById(spotId: string): Promise<IParkingSpot | null> {
    try {
      const spot = await ParkingSpot.findById(spotId);
      return spot;
    } catch (error) {
      logger.error(`Error fetching spot ${spotId}:`, error);
      throw error;
    }
  }

  async createSpot(spotData: Partial<IParkingSpot>): Promise<IParkingSpot> {
    try {
      const spot = await ParkingSpot.create(spotData);
      logger.info(`Created parking spot: ${spot.spotNumber}`);
      return spot;
    } catch (error) {
      logger.error('Error creating parking spot:', error);
      throw error;
    }
  }

  async updateSpot(spotId: string, updateData: Partial<IParkingSpot>): Promise<IParkingSpot | null> {
    try {
      const spot = await ParkingSpot.findByIdAndUpdate(
        spotId,
        updateData,
        { new: true, runValidators: true }
      );
      
      if (spot) {
        logger.info(`Updated parking spot: ${spot.spotNumber}`);
      }
      
      return spot;
    } catch (error) {
      logger.error(`Error updating spot ${spotId}:`, error);
      throw error;
    }
  }

  async deleteSpot(spotId: string): Promise<boolean> {
    try {
      const result = await ParkingSpot.findByIdAndDelete(spotId);
      if (result) {
        logger.info(`Deleted parking spot: ${result.spotNumber}`);
        return true;
      }
      return false;
    } catch (error) {
      logger.error(`Error deleting spot ${spotId}:`, error);
      throw error;
    }
  }

  async createTicket(ticketData: CreateTicketData): Promise<IParkingTicket> {
    try {
      // Check if spot exists and is available
      const spot = await ParkingSpot.findById(ticketData.parkingSpotId);
      if (!spot) {
        throw new Error('Parking spot not found');
      }
      
      if (spot.isOccupied) {
        throw new Error('Parking spot is already occupied');
      }

      // Generate codes
      const qrCodeData = JSON.stringify({
        ticketType: 'parking',
        licensePlate: ticketData.vehicle.licensePlate,
        timestamp: new Date().toISOString()
      });
      
      const qrCode = await QRCode.toDataURL(qrCodeData);
      
      // Generate barcode
      const barcodeData = `PKG${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
      const barcode = await this.generateBarcode(barcodeData);

      // Create ticket
      const ticket = await ParkingTicket.create({
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

      // Update spot status
      await ParkingSpot.findByIdAndUpdate(ticketData.parkingSpotId, {
        isOccupied: true,
        currentVehicle: ticket._id
      });

      logger.info(`Created parking ticket: ${ticket.ticketNumber} for ${ticketData.vehicle.licensePlate}`);
      
      return await ParkingTicket.findById(ticket._id)
        .populate('parkingSpot')
        .populate('customer', 'firstName lastName email phone')
        .populate('employee', 'firstName lastName') as IParkingTicket;
        
    } catch (error) {
      logger.error('Error creating parking ticket:', error);
      throw error;
    }
  }

  async exitVehicle(ticketId: string, paymentData?: {
    method: 'cash' | 'card' | 'digital' | 'monthly_pass';
    transactionId?: string;
  }): Promise<IParkingTicket> {
    try {
      const ticket = await ParkingTicket.findById(ticketId);
      if (!ticket) {
        throw new Error('Ticket not found');
      }

      if (ticket.status !== 'active') {
        throw new Error('Ticket is not active');
      }

      const exitTime = new Date();
      const duration = Math.ceil((exitTime.getTime() - ticket.entryTime.getTime()) / (1000 * 60)); // minutes
      const hours = Math.ceil(duration / 60);
      
      // Calculate pricing
      const subtotal = hours * ticket.pricing.hourlyRate;
      const tax = subtotal * 0.19; // 19% tax
      const total = subtotal + tax - ticket.pricing.discount;

      // Update ticket
      const updatedTicket = await ParkingTicket.findByIdAndUpdate(
        ticketId,
        {
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
        },
        { new: true }
      ).populate('parkingSpot');

      if (updatedTicket) {
        // Free up the parking spot
        await ParkingSpot.findByIdAndUpdate(updatedTicket.parkingSpot._id, {
          isOccupied: false,
          currentVehicle: null
        });

        logger.info(`Vehicle exited: ${updatedTicket.vehicle.licensePlate}, Duration: ${duration} minutes, Total: $${total}`);
      }

      return updatedTicket as IParkingTicket;
      
    } catch (error) {
      logger.error(`Error processing vehicle exit for ticket ${ticketId}:`, error);
      throw error;
    }
  }

  async getActiveTickets(filters?: {
    licensePlate?: string;
    customerId?: string;
    employeeId?: string;
    spotId?: string;
  }): Promise<IParkingTicket[]> {
    try {
      const query: any = { status: 'active' };
      
      if (filters) {
        if (filters.licensePlate) {
          query['vehicle.licensePlate'] = new RegExp(filters.licensePlate, 'i');
        }
        if (filters.customerId) query.customer = filters.customerId;
        if (filters.employeeId) query.employee = filters.employeeId;
        if (filters.spotId) query.parkingSpot = filters.spotId;
      }

      const tickets = await ParkingTicket.find(query)
        .populate('parkingSpot')
        .populate('customer', 'firstName lastName email phone')
        .populate('employee', 'firstName lastName')
        .sort({ entryTime: -1 });

      return tickets;
    } catch (error) {
      logger.error('Error fetching active tickets:', error);
      throw error;
    }
  }

  async getTicketHistory(filters?: {
    startDate?: Date;
    endDate?: Date;
    licensePlate?: string;
    customerId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    tickets: IParkingTicket[];
    totalCount: number;
    totalPages: number;
    currentPage: number;
  }> {
    try {
      const query: any = {};
      
      if (filters) {
        if (filters.startDate || filters.endDate) {
          query.entryTime = {};
          if (filters.startDate) query.entryTime.$gte = filters.startDate;
          if (filters.endDate) query.entryTime.$lte = filters.endDate;
        }
        if (filters.licensePlate) {
          query['vehicle.licensePlate'] = new RegExp(filters.licensePlate, 'i');
        }
        if (filters.customerId) query.customer = filters.customerId;
        if (filters.status) query.status = filters.status;
      }

      const page = filters?.page || 1;
      const limit = filters?.limit || 20;
      const skip = (page - 1) * limit;

      const [tickets, totalCount] = await Promise.all([
        ParkingTicket.find(query)
          .populate('parkingSpot')
          .populate('customer', 'firstName lastName email phone')
          .populate('employee', 'firstName lastName')
          .sort({ entryTime: -1 })
          .skip(skip)
          .limit(limit),
        ParkingTicket.countDocuments(query)
      ]);

      return {
        tickets,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page
      };
    } catch (error) {
      logger.error('Error fetching ticket history:', error);
      throw error;
    }
  }

  async getParkingMetrics(dateRange?: {
    startDate: Date;
    endDate: Date;
  }): Promise<ParkingMetrics> {
    try {
      const [totalSpots, occupiedSpots] = await Promise.all([
        ParkingSpot.countDocuments({ status: 'active' }),
        ParkingSpot.countDocuments({ status: 'active', isOccupied: true })
      ]);

      const availableSpots = totalSpots - occupiedSpots;
      const occupancyRate = totalSpots > 0 ? (occupiedSpots / totalSpots) * 100 : 0;

      // Revenue calculations
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

      // Average stay time
      const avgStayTime = await this.calculateAverageStayTime(dateRange);

      // Peak hours analysis
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
    } catch (error) {
      logger.error('Error calculating parking metrics:', error);
      throw error;
    }
  }

  private async calculateRevenue(startDate: Date, endDate: Date): Promise<number> {
    const result = await ParkingTicket.aggregate([
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

  private async calculateAverageStayTime(dateRange?: {
    startDate: Date;
    endDate: Date;
  }): Promise<number> {
    const query: any = { status: 'completed', duration: { $exists: true } };
    
    if (dateRange) {
      query.entryTime = {
        $gte: dateRange.startDate,
        $lte: dateRange.endDate
      };
    }

    const result = await ParkingTicket.aggregate([
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

  private async calculatePeakHours(dateRange?: {
    startDate: Date;
    endDate: Date;
  }): Promise<Array<{ hour: number; occupancy: number }>> {
    const query: any = {};
    
    if (dateRange) {
      query.entryTime = {
        $gte: dateRange.startDate,
        $lte: dateRange.endDate
      };
    }

    const result = await ParkingTicket.aggregate([
      { $match: query },
      {
        $group: {
          _id: { $hour: '$entryTime' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Fill in missing hours with 0
    const peakHours = Array.from({ length: 24 }, (_, hour) => {
      const hourData = result.find(r => r._id === hour);
      return {
        hour,
        occupancy: hourData ? hourData.count : 0
      };
    });

    return peakHours;
  }

  private async generateBarcode(data: string): Promise<string> {
    try {
      const buffer = await bwipjs.toBuffer({
        bcid: 'code128',
        text: data,
        scale: 3,
        height: 10,
        includetext: true,
        textxalign: 'center'
      });
      
      return `data:image/png;base64,${buffer.toString('base64')}`;
    } catch (error) {
      logger.error('Error generating barcode:', error);
      return '';
    }
  }

  async findTicketByBarcode(barcode: string): Promise<IParkingTicket | null> {
    try {
      return await ParkingTicket.findOne({ barcode })
        .populate('parkingSpot')
        .populate('customer', 'firstName lastName email phone')
        .populate('employee', 'firstName lastName');
    } catch (error) {
      logger.error(`Error finding ticket by barcode ${barcode}:`, error);
      throw error;
    }
  }

  async findTicketByLicensePlate(licensePlate: string): Promise<IParkingTicket[]> {
    try {
      return await ParkingTicket.find({
        'vehicle.licensePlate': new RegExp(licensePlate, 'i'),
        status: 'active'
      })
        .populate('parkingSpot')
        .populate('customer', 'firstName lastName email phone')
        .populate('employee', 'firstName lastName');
    } catch (error) {
      logger.error(`Error finding tickets by license plate ${licensePlate}:`, error);
      throw error;
    }
  }
}

export default new ParkingService();