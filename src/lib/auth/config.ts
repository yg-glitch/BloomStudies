export const authConfig = {
  providers: {
    google: {
      enabled: true,
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    },
    apple: {
      enabled: true,
      clientId: process.env.APPLE_CLIENT_ID,
      clientSecret: process.env.APPLE_CLIENT_SECRET,
    },
    microsoft: {
      enabled: true,
      clientId: process.env.MICROSOFT_CLIENT_ID,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
    },
  },
  phone: {
    enabled: true,
  },
  magicLink: {
    enabled: true,
  },
}
