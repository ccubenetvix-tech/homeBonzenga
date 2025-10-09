// Simple configuration for development
process.env.DATABASE_URL = process.env.DATABASE_URL || "postgresql://postgres:password@localhost:5432/homebonzenga";
process.env.JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key-for-development";
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
process.env.JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "30d";
process.env.PORT = process.env.PORT || "3001";
process.env.NODE_ENV = process.env.NODE_ENV || "development";
process.env.CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:5173";

module.exports = {};
