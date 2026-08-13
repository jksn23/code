import 'dotenv/config';

const isProduction = process.env.NODE_ENV === 'production';

if (isProduction && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET wajib diisi pada environment production.');
}

export const jwtSecret = process.env.JWT_SECRET || 'development-only-jwt-secret';
export const isProductionEnvironment = isProduction;
