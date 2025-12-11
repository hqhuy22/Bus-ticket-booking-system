import bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import UserRepository from '../repositories/user.repository';
import EmailService from './email.service';
import { getClient } from '../config/db';

const JWT_SECRET = process.env.JWT_SECRET || 'devsecret';
// default to 60 seconds for faster verification expiry during testing/demo
const EMAIL_VERIFICATION_SECONDS = process.env.EMAIL_VERIFICATION_SECONDS
  ? Number(process.env.EMAIL_VERIFICATION_SECONDS)
  : 60;

export default class UserService {
  static async register({
    email,
    phone,
    password,
  }: {
    email?: string;
    phone?: string;
    password: string;
  }) {
    if (!email && !phone) {
      throw new Error('either email or phone required');
    }
    if (!password || password.length < 6) {
      throw new Error('password must be at least 6 characters');
    }

    if (email) {
      const existing = await UserRepository.findByEmail(email);
      if (existing) throw new Error('email already registered');
    }

    const password_hash = await bcrypt.hash(password, 10);

    // If email provided, create user inside a transaction and only commit if email sent
    if (email) {
      const client = await getClient();
      try {
        await client.query('BEGIN');
        const user = await UserRepository.create({ email, phone, password_hash }, client);

        const token = jwt.sign(
          { sub: user.id, email: user.email },
          JWT_SECRET as jwt.Secret,
          { expiresIn: `${EMAIL_VERIFICATION_SECONDS}s` } as jwt.SignOptions,
        );
        const emailService = new EmailService();
        // Point users to a friendly verification page which will call the API when they click "Check Verify"
        const verifyUrl = `${
          process.env.APP_BASE_URL || 'http://localhost:3000'
        }/verify?token=${token}`;
        // eslint-disable-next-line no-console
        console.log('Sending verification email to:', user.email, 'verifyUrl:', verifyUrl);
        await emailService.sendMail({
          to: user.email!,
          subject: 'Verify your email',
          html: `Please verify your email by clicking <a href="${verifyUrl}">here</a>`,
        });

        await client.query('COMMIT');
        return user;
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    }

    // fallback: no email provided -> create normally
    const user = await UserRepository.create({ email, phone, password_hash });
    return user;
  }

  static async verifyEmail(token: string) {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    // enforce server-side token age check
    const iat = payload.iat as number | undefined;
    if (!iat) throw new Error('invalid token');
    const age = Math.floor(Date.now() / 1000) - iat;
    if (age > EMAIL_VERIFICATION_SECONDS) throw new Error('token expired');

    const userId = payload.sub as string;
    const user = await UserRepository.findById(userId);
    if (!user) throw new Error('invalid token');

    await UserRepository.markVerified(userId);
    return true;
  }

  static async resendVerification(email: string) {
    const user = await UserRepository.findByEmail(email);
    if (!user) throw new Error('email not found');

    const token = jwt.sign(
      { sub: user.id, email: user.email },
      JWT_SECRET as jwt.Secret,
      { expiresIn: `${EMAIL_VERIFICATION_SECONDS}s` } as jwt.SignOptions,
    );

    const emailService = new EmailService();
    const verifyUrl = `${
      process.env.APP_BASE_URL || 'http://localhost:3000'
    }/verify?token=${token}`;
    // eslint-disable-next-line no-console
    console.log('Resending verification email to:', user.email, 'verifyUrl:', verifyUrl);
    await emailService.sendMail({
      to: user.email!,
      subject: 'Verify your email',
      html: `Please verify your email by clicking <a href="${verifyUrl}">here</a>`,
    });

    return true;
  }

  static async isVerified(email: string) {
    const user = await UserRepository.findByEmail(email);
    if (!user) throw new Error('email not found');
    return Boolean(user.verified_at);
  }
}
