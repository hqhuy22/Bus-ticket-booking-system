"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
let passport;
let GoogleStrategy;
const user_repository_1 = __importDefault(require("../repositories/user.repository"));
try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    passport = require('passport');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    GoogleStrategy = require('passport-google-oauth20').Strategy;
}
catch (e) {
    // fallback noop passport when not installed (eg: test env)
    passport = {
        use: () => { },
        initialize: () => (req, res, next) => next(),
        authenticate: () => (req, res, next) => next(),
    };
    GoogleStrategy = null;
}
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || '';
// Only configure strategy when env vars are present. This keeps startup safe in test envs.
if (CLIENT_ID && CLIENT_SECRET && CALLBACK_URL && GoogleStrategy) {
    passport.use(new GoogleStrategy({
        clientID: CLIENT_ID,
        clientSecret: CLIENT_SECRET,
        callbackURL: CALLBACK_URL,
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            const email = profile.emails && profile.emails[0] && profile.emails[0].value;
            if (!email)
                return done(new Error('No email in Google profile'), undefined);
            let user = await user_repository_1.default.findByEmail(email);
            if (!user) {
                // create a minimal user record and mark as verified
                user = await user_repository_1.default.create({ email, role: 'user' });
                await user_repository_1.default.markVerified(user.id);
            }
            else if (!user.verified_at) {
                await user_repository_1.default.markVerified(user.id);
            }
            return done(null, user);
        }
        catch (err) {
            return done(err);
        }
    }));
}
exports.default = passport;
