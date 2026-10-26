import dotenv from 'dotenv';
import { z } from 'zod';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CLIENT_URL: z.string().default('http://localhost:5173'),
  MONGODB_URI: z.string().default('mongodb://localhost:27017/carenova'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters').default('carenova_super_secret_jwt_key_2026_production_ready_healthcare'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  COOKIE_SECRET: z.string().default('carenova_cookie_secret_secure_hash_token_2026'),
  INITIAL_SETUP_ENABLED: z.coerce.boolean().default(true),
  BOOTSTRAP_ADMIN_NAME: z.string().default('Hospital Director Dr. Anita Roy'),
  BOOTSTRAP_ADMIN_EMAIL: z.string().email().default('admin@carenova.hospital'),
  BOOTSTRAP_ADMIN_PASSWORD: z.string().min(8).default('AdminSecure@2026!'),
  HOSPITAL_TIMEZONE: z.string().default('Asia/Kolkata'),
  HOSPITAL_CURRENCY: z.string().default('INR'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables configuration:', parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
