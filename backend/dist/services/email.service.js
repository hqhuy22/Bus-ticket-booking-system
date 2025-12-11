"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const nodemailer_1 = __importDefault(require("nodemailer"));
class EmailService {
    constructor() {
        this.transporter = null;
        // don't create real transporter while testing
        if (process.env.NODE_ENV === 'test')
            return;
        this.transporter = nodemailer_1.default.createTransport({
            host: process.env.SMTP_HOST || 'localhost',
            port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 1025,
            secure: false,
            auth: process.env.SMTP_USER
                ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
                : undefined,
        });
        // verify transporter immediately to fail fast and log clearer errors
        this.transporter
            .verify()
            .then(() => {
            // eslint-disable-next-line no-console
            console.log('SMTP transporter verified');
        })
            .catch((err) => {
            // eslint-disable-next-line no-console
            console.error('SMTP transporter verification failed:', err && err.message ? err.message : err);
        });
    }
    async sendMail(opts) {
        if (process.env.NODE_ENV === 'test') {
            // no-op in tests
            return Promise.resolve({ accepted: [opts.to], messageId: 'test' });
        }
        if (!this.transporter)
            throw new Error('Email transporter not configured');
        // basic validation & debug logging to ensure we send to the intended recipient
        const intendedTo = opts.to;
        const smtpUser = process.env.SMTP_USER;
        // eslint-disable-next-line no-console
        console.log('EmailService.sendMail - from:', process.env.EMAIL_FROM, 'smtpUser:', smtpUser, 'intendedTo:', intendedTo);
        if (!intendedTo) {
            throw new Error('missing recipient (to)');
        }
        try {
            const info = await this.transporter.sendMail({
                from: process.env.EMAIL_FROM || process.env.SMTP_USER || 'noreply@example.com',
                to: intendedTo,
                subject: opts.subject,
                html: opts.html,
            });
            // eslint-disable-next-line no-console
            console.log('Email sent:', {
                accepted: info && info.accepted,
                rejected: info && info.rejected,
                messageId: info && info.messageId,
            });
            return info;
        }
        catch (err) {
            // eslint-disable-next-line no-console
            console.error('Failed to send email:', err && err.message ? err.message : err);
            throw err;
        }
    }
}
exports.default = EmailService;
