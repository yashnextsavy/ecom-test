import { loadEnv, defineConfig } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

const easebuzzRequiredEnv = {
  key: process.env.EASEBUZZ_KEY,
  salt: process.env.EASEBUZZ_SALT,
  successUrl: process.env.EASEBUZZ_SUCCESS_URL,
  failureUrl: process.env.EASEBUZZ_FAILURE_URL,
}

const isEasebuzzConfigured = Object.values(easebuzzRequiredEnv).every(
  (value) => typeof value === "string" && value.trim().length > 0
)

if (!isEasebuzzConfigured) {
  console.warn(
    "[medusa-config] Easebuzz provider is disabled because required env vars are missing. Configure EASEBUZZ_KEY, EASEBUZZ_SALT, EASEBUZZ_SUCCESS_URL, and EASEBUZZ_FAILURE_URL."
  )
}

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    },
    cookieOptions: {
      sameSite: "lax",
      secure: false,
    },
  },
  modules: [
    {
      resolve: "@medusajs/payment",
      options: {
        providers: isEasebuzzConfigured
          ? [
              {
                resolve: "./src/modules/payment-easebuzz",
                id: "default",
                options: {
                  key: process.env.EASEBUZZ_KEY,
                  salt: process.env.EASEBUZZ_SALT,
                  env: process.env.EASEBUZZ_ENV || "test",
                  successUrl: process.env.EASEBUZZ_SUCCESS_URL,
                  failureUrl: process.env.EASEBUZZ_FAILURE_URL,
                  productInfo: process.env.EASEBUZZ_PRODUCT_INFO || "Order Payment",
                  paymentUrl: process.env.EASEBUZZ_PAYMENT_URL,
                  refundUrl: process.env.EASEBUZZ_REFUND_URL,
                  refundApiVersion:
                    process.env.EASEBUZZ_REFUND_API_VERSION === "v1" ? "v1" : "v2",
                },
              },
            ]
          : [],
      },
    },
    {
      resolve: "@medusajs/file",
      options: {
        providers: [
          {
            resolve: "@medusajs/file-local",
            id: "local",
            options: {
              backend_url: process.env.FILE_BACKEND_URL || "http://192.168.1.24:9000/static",
            },
          },
        ],
      },
    },
    {
      resolve: "./src/modules/product-media",
    },
    {
      resolve: "./src/modules/exam-series",
    },
    {
      resolve: "./src/modules/contact-requests",
    },
    {
      resolve: "./src/modules/checkout-otp",
    },
    {
      resolve: "./src/modules/payment-recovery",
    },
    {
      resolve: "./src/modules/countries",
    },
    {
      resolve: "./src/modules/invoice-generator",
    },
    {
      resolve: "./src/modules/email-template-config",
    },
  ],

})
