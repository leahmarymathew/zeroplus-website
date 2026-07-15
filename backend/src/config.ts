import "dotenv/config";
import { z } from "zod";

// All process.env access happens here, once, validated on boot.
// Blank strings for optional providers put that integration in dev/mock mode.
const Env = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
  JWT_REFRESH_SECRET: z.string().min(1, "JWT_REFRESH_SECRET is required"),

  GOOGLE_CLIENT_ID: z.string().default(""),

  PHONEPE_MERCHANT_ID: z.string().default(""),
  PHONEPE_SALT_KEY: z.string().default(""),
  PHONEPE_SALT_INDEX: z.string().default("1"),
  PHONEPE_BASE_URL: z.string().default("https://api-preprod.phonepe.com/apis/pg-sandbox"),

  CLOUDINARY_CLOUD_NAME: z.string().default(""),
  CLOUDINARY_API_KEY: z.string().default(""),
  CLOUDINARY_API_SECRET: z.string().default(""),

  RESEND_API_KEY: z.string().default(""),
  EMAIL_FROM: z.string().default("Zeroplus <onboarding@resend.dev>"),

  OTP_PROVIDER: z.enum(["console", "msg91"]).default("console"),
  MSG91_AUTH_KEY: z.string().default(""),

  PORT: z.coerce.number().default(4000),
  FRONTEND_URL: z.string().default("http://localhost:3000"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

const parsed = Env.safeParse(process.env);
if (!parsed.success) {
  console.error("Invalid environment configuration:");
  for (const issue of parsed.error.issues) {
    console.error(`  ${issue.path.join(".")}: ${issue.message}`);
  }
  process.exit(1);
}

const env = parsed.data;

export const config = {
  databaseUrl: env.DATABASE_URL,
  jwt: {
    accessSecret: env.JWT_SECRET,
    refreshSecret: env.JWT_REFRESH_SECRET,
    accessTtl: "15m",
    refreshTtlDays: 30,
  },
  googleClientId: env.GOOGLE_CLIENT_ID,
  phonepe: {
    merchantId: env.PHONEPE_MERCHANT_ID,
    saltKey: env.PHONEPE_SALT_KEY,
    saltIndex: env.PHONEPE_SALT_INDEX,
    baseUrl: env.PHONEPE_BASE_URL,
    // no creds -> mock mode: fake redirect URL, no real API call
    enabled: env.PHONEPE_MERCHANT_ID !== "" && env.PHONEPE_SALT_KEY !== "",
  },
  cloudinary: {
    cloudName: env.CLOUDINARY_CLOUD_NAME,
    apiKey: env.CLOUDINARY_API_KEY,
    apiSecret: env.CLOUDINARY_API_SECRET,
    enabled: env.CLOUDINARY_CLOUD_NAME !== "" && env.CLOUDINARY_API_SECRET !== "",
  },
  resend: {
    apiKey: env.RESEND_API_KEY,
    from: env.EMAIL_FROM,
    enabled: env.RESEND_API_KEY !== "",
  },
  otp: {
    provider: env.OTP_PROVIDER,
    msg91AuthKey: env.MSG91_AUTH_KEY,
    ttlSeconds: 300, // plan Section 5: 5 minutes
    maxAttempts: 5,
  },
  port: env.PORT,
  frontendUrl: env.FRONTEND_URL,
  isProd: env.NODE_ENV === "production",
  isTest: env.NODE_ENV === "test",
} as const;
