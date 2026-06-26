import logger from '../utils/logger';

const connectDB = async (): Promise<void> => {
  logger.info('📁 SQLite database active (via DatabaseService)');
  logger.info('✅ Database system ready');
};

export default connectDB;
