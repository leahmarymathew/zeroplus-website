// Runs before any test file imports the app. Google sign-in tests mock
// google-auth-library's verifyIdToken, but auth.service.ts's own guard checks
// config.googleClientId is non-empty *before* ever calling it — so a value
// must be present here regardless of what's in the real .env.
process.env.GOOGLE_CLIENT_ID ||= "test-google-client-id";
