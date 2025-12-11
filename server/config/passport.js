import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import Customer from '../models/Customer.js';

// Only configure Google OAuth if credentials are provided
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

// Check if Google OAuth credentials are valid (not placeholder values)
const isGoogleOAuthConfigured =
  googleClientId &&
  googleClientSecret &&
  !googleClientId.includes('your-client-id') &&
  !googleClientSecret.includes('your-client-secret') &&
  googleClientId.trim() !== '' &&
  googleClientSecret.trim() !== '';

if (isGoogleOAuthConfigured) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: googleClientId,
        clientSecret: googleClientSecret,
        callbackURL:
          process.env.GOOGLE_CALLBACK_URL || 'http://localhost:4000/api/auth/google/callback',
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Check if user already exists
          let customer = await Customer.findOne({
            where: { googleId: profile.id },
          });

          if (customer) {
            // User exists, return a plain object to avoid Sequelize instance serialization issues
            return done(
              null,
              customer && typeof customer.toJSON === 'function' ? customer.toJSON() : customer
            );
          }

          // Check if email already exists with local provider
          const existingEmail = await Customer.findOne({
            where: { email: profile.emails[0].value },
          });

          if (existingEmail) {
            // Email exists but with local provider
            return done(null, false, {
              message:
                'An account with this email already exists. Please login with username and password.',
            });
          }

          // Create new user
          customer = await Customer.create({
            googleId: profile.id,
            email: profile.emails[0].value,
            username:
              profile.emails[0].value.split('@')[0] + '_' + Math.random().toString(36).substr(2, 5),
            fullName: profile.displayName || null,
            password: null, // No password for OAuth users
            position: 'customer',
            isVerified: true, // Google accounts are pre-verified
            provider: 'google',
          });

          // Return plain object
          return done(
            null,
            customer && typeof customer.toJSON === 'function' ? customer.toJSON() : customer
          );
        } catch (error) {
          return done(error, null);
        }
      }
    )
  );
} else {
  console.log(
    '⚠️  Google OAuth not configured. Skipping Google authentication setup. ' +
      'To enable Google login, set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env file.'
  );
}

// Serialize user for session
passport.serializeUser((user, done) => {
  // user may be an object or an id
  const id = user && (user.id || (typeof user === 'number' ? user : null));
  done(null, id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const customer = await Customer.findByPk(id, {
      attributes: { exclude: ['password'] },
    });
    done(null, customer);
  } catch (error) {
    done(error, null);
  }
});

export default passport;
