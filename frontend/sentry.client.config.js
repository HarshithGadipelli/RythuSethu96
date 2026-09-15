// Sentry Client Configuration for RythuJanaSethu
// To activate: Add NEXT_PUBLIC_SENTRY_DSN to your Vercel environment variables

const SENTRY_DSN = typeof process !== "undefined" ? process.env?.NEXT_PUBLIC_SENTRY_DSN : undefined;

if (SENTRY_DSN) {
  import("@sentry/nextjs").then((Sentry) => {
    Sentry.init({
      dsn: SENTRY_DSN,
      environment: process.env.NODE_ENV || "production",
      tracesSampleRate: 0.2, // 20% of transactions for performance monitoring
      replaysSessionSampleRate: 0.05, // 5% of sessions for session replay
      replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors
      debug: false,
    });
    console.log("🛡️ Sentry client monitoring active");
  }).catch(() => {
    // @sentry/nextjs not installed yet — skip silently
  });
}

export {};
