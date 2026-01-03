import nodemailer from 'nodemailer';
import sgMail from '@sendgrid/mail';
import aws from '@aws-sdk/client-ses';
import { defaultProvider } from '@aws-sdk/credential-provider-node';

/**
 * Remove Vietnamese accents from string
 * Converts: "Vung T�u"                                 <tr>
                        <td style="padding: 15px; background-color: #                         </a>
                    </div>
                    
                    <!-- Important Info -->
                    <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin-top: 30px;">
                      <p style="margin: 0; font-size: 14px; color: #856404;">
                        <strong>?? Important:</strong> Please arrive at the departure point at least 15 minutes before departure time.
                        Carry a valid ID proof for verification.
                      </p>
                    </div>       <!-- Important Info -->
                    <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin-top: 30px;">
                      <p style="margin: 0; font-size: 14px; color: #856404;">
                        <strong>?? Important:</strong> Please arrive at the departure point at least 15 minutes before departure time.
                        Carry a valid ID proof for verification.
                      </p>
                    </div> border-bottom: 1px solid #e0e0e0;">
                          <strong sty                    <!-- Journey Details -->
                    <div style="background-color: #fff3cd; border-left: 4px s                    <!-- Booking Details -->
                    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin-bottom: 30px;">
                      <p style="margin: 0 0 10px;"><strong>Booking Reference:</strong> ${bookingDetails.bookingReference}</p>
                      <p style="margin: 0 0 10px;"><strong>Route:</strong> ${removeVietnameseAccents(bookingDetails.departure)} -> ${removeVietnameseAccents(bookingDetails.arrival)}</p>
                      <p style="margin: 0 0 10px;"><strong>Date:</strong> ${bookingDetails.date}</p>
                      <p style="margin: 0;"><strong>Refund Amount:</strong> Rs. ${bookingDetails.refundAmount || bookingDetails.totalPay}</p>
                    </div>fc107; padding: 20px; margin-bottom: 30px;">
                      <h3 style="margin: 0 0 15px; color: #856404; font-size: 18px;">Journey Details</h3>
                      <table role="presentation" style="width: 100%;">
                        <tr>
                          <td style="padding: 5px 0;"><strong>Route:</strong></td>
                          <td style="padding: 5px 0; text-align: right;">${removeVietnameseAccents(bookingDetails.departure)} -> ${removeVietnameseAccents(bookingDetails.arrival)}</td>
                        </tr>
                        <tr>
                          <td style="padding: 5px 0;"><strong>Date:</strong></td>
                          <td style="padding: 5px 0; text-align: right;">${bookingDetails.date}</td>
                        </tr>333; font-size: 14px;">Route</strong>
                        </td>
                        <td style="padding: 15px; background-color: #f8f9fa; border-bottom: 1px solid #e0e0e0; text-align: right;">
                          <span style="color: #666; font-size: 14px;">${removeVietnameseAccents(bookingDetails.departure)} -> ${removeVietnameseAccents(bookingDetails.arrival)}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 15px; background-color: #ffffff; border-bottom: 1px solid #e0e0e0;">
                          <strong style="color: #333; font-size: 14px;">Journey Date</strong>
                        </td>- Journey Details -->
                    <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                      <tr>
                        <td style="padding: 15px; background-color: #f8f9fa; border-bottom: 1px solid #e0e0e0;">
                          <strong style="color: #333; font-size: 14px;">Route</strong>
                        </td>
                        <td style="padding: 15px; background-color: #f8f9fa; border-bottom: 1px solid #e0e0e0; text-align: right;">
                          <span style="color: #666; font-size: 14px;">${removeVietnameseAccents(bookingDetails.departure)} -> ${removeVietnameseAccents(bookingDetails.arrival)}</span>
                        </td>
                      </tr>Tau"
 */
const removeVietnameseAccents = (str) => {
  if (!str) return str;

  // Normalize and remove combining diacritical marks
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/d/g, 'd')
    .replace(/�/g, 'D');
};

// Configure SendGrid if API key is provided
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

// Configure AWS SES if credentials are provided
let sesClient;
if (process.env.AWS_REGION) {
  sesClient = new aws.SES({
    region: process.env.AWS_REGION,
    credentials: defaultProvider(),
  });
}

// Create reusable transporter
const createTransporter = () => {
  // Check for SendGrid
  if (process.env.EMAIL_PROVIDER === 'sendgrid' && process.env.SENDGRID_API_KEY) {
    console.log('Using SendGrid for email service');
    return null; // SendGrid uses its own API, not nodemailer
  }

  // Check for AWS SES
  if (process.env.EMAIL_PROVIDER === 'ses' && sesClient) {
    console.log('Using AWS SES for email service');
    return null; // AWS SES uses its own SDK, not nodemailer
  }

  // If SMTP host is provided or EMAIL_SERVICE explicitly set to 'smtp', use explicit SMTP transport
  const useSmtp = process.env.EMAIL_SERVICE === 'smtp' || !!process.env.SMTP_HOST;

  if (useSmtp) {
    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = parseInt(process.env.SMTP_PORT, 10) || 587;
    const secure = process.env.SMTP_SECURE === 'true' || port === 465;

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
      // Add connection timeout
      connectionTimeout: 10000, // 10 seconds
      greetingTimeout: 10000, // 10 seconds
      socketTimeout: 30000, // 30 seconds
    });

    // Optional: verify connection configuration when creating transporter to surface auth/connection issues early.
    transporter
      .verify()
      .then(() => {
        console.log('SMTP transporter verified');
      })
      .catch((err) => {
        console.error(
          'SMTP transporter verification failed:',
          err && err.message ? err.message : err
        );
      });

    return transporter;
  }

  // Fallback to nodemailer service config (e.g., 'gmail')
  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD, // App password or OAuth2 token
    },
    // Add connection timeout
    connectionTimeout: 10000, // 10 seconds
    greetingTimeout: 10000, // 10 seconds
    socketTimeout: 30000, // 30 seconds
  });
};

/**
 * Universal email sending function that works with all providers
 * Wraps email sending with timeout to prevent hanging requests
 */
export const sendEmail = async (mailOptions) => {
  console.log(
    `[Email] Attempting to send email to: ${mailOptions.to}, subject: ${mailOptions.subject}`
  );

  // Wrap the entire email send operation with a timeout
  const emailTimeout = parseInt(process.env.EMAIL_TIMEOUT || '45000', 10); // 45 seconds default
  
  const sendPromise = (async () => {
    // SendGrid
    if (process.env.EMAIL_PROVIDER === 'sendgrid' && process.env.SENDGRID_API_KEY) {
      console.log('[Email] Using SendGrid provider');
      const msg = {
        to: mailOptions.to,
        from: process.env.SENDGRID_FROM_EMAIL || process.env.EMAIL_USER,
        subject: mailOptions.subject,
        html: mailOptions.html,
      };
      await sgMail.send(msg);
      console.log(`[Email] SendGrid email sent successfully to ${mailOptions.to}`);
      return;
    }

    // AWS SES
    if (process.env.EMAIL_PROVIDER === 'ses' && sesClient) {
      console.log('[Email] Using AWS SES provider');
      const params = {
        Source: process.env.AWS_SES_FROM_EMAIL || process.env.EMAIL_USER,
        Destination: {
          ToAddresses: Array.isArray(mailOptions.to) ? mailOptions.to : [mailOptions.to],
        },
        Message: {
          Subject: {
            Data: mailOptions.subject,
            Charset: 'UTF-8',
          },
          Body: {
            Html: {
              Data: mailOptions.html,
              Charset: 'UTF-8',
            },
          },
        },
      };
      const command = new aws.SendEmailCommand(params);
      await sesClient.send(command);
      console.log(`[Email] AWS SES email sent successfully to ${mailOptions.to}`);
      return;
    }

    // Nodemailer (SMTP or Gmail)
    console.log('[Email] Using Nodemailer (SMTP/Gmail)');
    const transporter = createTransporter();
    const info = await transporter.sendMail(mailOptions);
    console.log(
      `[Email] Nodemailer email sent successfully to ${mailOptions.to}, messageId: ${info.messageId}`
    );
  })();

  // Race between email send and timeout
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(
      () => reject(new Error(`Email sending timeout after ${emailTimeout}ms`)),
      emailTimeout
    );
  });

  try {
    await Promise.race([sendPromise, timeoutPromise]);
  } catch (error) {
    console.error(`[Email] Failed to send email to ${mailOptions.to}:`, error.message);
    throw error;
  }
};

/**
 * Send verification email
 */
export const sendVerificationEmail = async (email, username, verificationToken) => {
  // Use server verify endpoint as the primary link so clicking from email verifies immediately.
  // The frontend page will still show status after redirect.
  const serverVerifyBase = process.env.SERVER_URL || `http://localhost:${process.env.PORT || 4000}`;
  const verificationUrl = `${serverVerifyBase}/api/customer/verify-email?token=${verificationToken}`;

  const mailOptions = {
    from: `"QTechy Bus Booking" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Verify Your Email - QTechy Bus Booking',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #6d4aff;">Welcome to QTechy Bus Booking!</h2>
        <p>Hi <strong>${username}</strong>,</p>
        <p>Thank you for registering. Please verify your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" 
             style="background-color: #6d4aff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Verify Email
          </a>
        </div>
  <p>Or copy and paste this link into your browser (if the button doesn't work):</p>
  <p style="color: #666; word-break: break-all;">${verificationUrl}</p>
  <hr />
  <p style="font-size:12px; color:#666;">If you prefer, you can also open the app verify page and paste the token from above.</p>
        <p>This link will expire in 24 hours.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #999; font-size: 12px;">If you didn't create an account, please ignore this email.</p>
      </div>
    `,
  };

  await sendEmail(mailOptions);
};

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = async (email, username, resetToken) => {
  const resetUrl = `${process.env.CLIENT_URL}/bus-booking/reset-password?token=${resetToken}`;

  const mailOptions = {
    from: `"QTechy Bus Booking" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Password Reset Request - QTechy Bus Booking',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #6d4aff;">Password Reset Request</h2>
        <p>Hi <strong>${username}</strong>,</p>
        <p>You requested to reset your password. Click the button below to proceed:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="background-color: #6d4aff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p>Or copy and paste this link into your browser:</p>
        <p style="color: #666; word-break: break-all;">${resetUrl}</p>
        <p>This link will expire in 1 hour.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #999; font-size: 12px;">If you didn't request a password reset, please ignore this email and your password will remain unchanged.</p>
      </div>
    `,
  };

  await sendEmail(mailOptions);
};

/**
 * Send booking confirmation email with optional e-ticket attachment
 */
export const sendBookingConfirmation = async (
  email,
  username,
  bookingDetails,
  ticketPdfBuffer = null
) => {
  const clientBase =
    process.env.CLIENT_URL ||
    (process.env.SERVER_URL || `http://localhost:${process.env.PORT || 4000}`).replace(
      /:\d+$/,
      `:${process.env.CLIENT_PORT || process.env.PORT || 3000}`
    );
  const viewUrl = `${clientBase.replace(/\/$/, '')}/bus-booking/guest-booking-details`;

  const mailOptions = {
    from: `"QTechy Bus Booking" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Booking Confirmation - QTechy Bus Booking',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Booking Confirmation</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td align="center" style="padding: 40px 0;">
              <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <!-- Header -->
                <tr>
                  <td style="padding: 40px 30px; background: linear-gradient(135deg, #6d4aff 0%, #8b5aff 100%); text-align: center;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px;">Booking Confirmed!</h1>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <p style="margin: 0 0 20px; font-size: 16px; color: #333;">Hi <strong>${username}</strong>,</p>
                    <p style="margin: 0 0 30px; font-size: 16px; color: #666;">
                      Your bus booking has been confirmed successfully! Here are your booking details:
                    </p>
                    
                    <!-- Booking Reference Box -->
                    <div style="background-color: #f8f9fa; border-left: 4px solid #6d4aff; padding: 20px; margin-bottom: 30px;">
                      <p style="margin: 0 0 10px; font-size: 14px; color: #666; text-transform: uppercase; letter-spacing: 1px;">Booking Reference</p>
                      <p style="margin: 0; font-size: 24px; font-weight: bold; color: #6d4aff; font-family: monospace; letter-spacing: 2px;">
                        ${bookingDetails.bookingReference}
                      </p>
                    </div>
                    
                    <!-- Journey Details -->
                    <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                      <tr>
                        <td style="padding: 15px; background-color: #f8f9fa; border-bottom: 1px solid #e0e0e0;">
                          <strong style="color: #333; font-size: 14px;">Route</strong>
                        </td>
                        <td style="padding: 15px; background-color: #f8f9fa; border-bottom: 1px solid #e0e0e0; text-align: right;">
                          <span style="color: #666; font-size: 14px;">${bookingDetails.departure} → ${bookingDetails.arrival}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 15px; background-color: #ffffff; border-bottom: 1px solid #e0e0e0;">
                          <strong style="color: #333; font-size: 14px;">Journey Date</strong>
                        </td>
                        <td style="padding: 15px; background-color: #ffffff; border-bottom: 1px solid #e0e0e0; text-align: right;">
                          <span style="color: #666; font-size: 14px;">${bookingDetails.date}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 15px; background-color: #f8f9fa; border-bottom: 1px solid #e0e0e0;">
                          <strong style="color: #333; font-size: 14px;">Departure Time</strong>
                        </td>
                        <td style="padding: 15px; background-color: #f8f9fa; border-bottom: 1px solid #e0e0e0; text-align: right;">
                          <span style="color: #666; font-size: 14px;">${bookingDetails.time}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 15px; background-color: #ffffff; border-bottom: 1px solid #e0e0e0;">
                          <strong style="color: #333; font-size: 14px;">Seat Number(s)</strong>
                        </td>
                        <td style="padding: 15px; background-color: #ffffff; border-bottom: 1px solid #e0e0e0; text-align: right;">
                          <span style="color: #6d4aff; font-weight: bold; font-size: 14px;">${bookingDetails.seatNo}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 15px; background-color: #f8f9fa;">
                          <strong style="color: #333; font-size: 16px;">Total Amount</strong>
                        </td>
                        <td style="padding: 15px; background-color: #f8f9fa; text-align: right;">
                          <span style="color: #28a745; font-weight: bold; font-size: 18px;">Rs. ${bookingDetails.totalPay}</span>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- Action Button -->
                    <div style="text-align: center; margin: 30px 0;">
                      <a href="${viewUrl}" style="display: inline-block; padding: 15px 40px; background-color: #6d4aff; color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
                        View Booking Details
                      </a>
                    </div>
                    
                    <!-- Important Info -->
                    <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin-top: 30px;">
                      <p style="margin: 0; font-size: 14px; color: #856404;">
                        <strong>⚠️ Important:</strong> Please arrive at the departure point at least 15 minutes before departure time.
                        Carry a valid ID proof for verification.
                      </p>
                    </div>
                    
                    <p style="margin: 30px 0 0; font-size: 16px; color: #666;">
                      Have a safe and pleasant journey! 🚌
                    </p>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="padding: 30px; background-color: #f8f9fa; text-align: center; border-top: 1px solid #e0e0e0;">
                    <p style="margin: 0 0 10px; font-size: 14px; color: #999;">
                      QTechy Bus Booking - Your trusted travel partner
                    </p>
                    <p style="margin: 0; font-size: 12px; color: #999;">
                      This is an automated email. Please do not reply to this message.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  };

  // Add e-ticket attachment if provided
  if (ticketPdfBuffer) {
    mailOptions.attachments = [
      {
        filename: `e-ticket-${bookingDetails.bookingReference}.pdf`,
        content: ticketPdfBuffer,
        contentType: 'application/pdf',
      },
    ];
  }

  await sendEmail(mailOptions);
};

/**
 * Send guest lookup verification email (one-time token link)
 */
export const sendGuestLookupVerification = async (email, username, token, verifyUrl) => {
  const mailOptions = {
    from: `"QTechy Bus Booking" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Verify Your Booking - QTechy Bus Booking',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #6d4aff;">Verify Your Booking</h2>
        <p>Hi <strong>${username}</strong>,</p>
        <p>Someone requested to view the booking for your reference. Use the button below to verify and view your booking details. The token will expire in 15 minutes.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verifyUrl}" 
             style="background-color: #6d4aff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Verify and View Booking
          </a>
        </div>
        <p style="color: #666; word-break: break-all;">If the button does not work, use this token: <strong>${token}</strong></p>
        <p style="color: #666; word-break: break-all;">Or paste this link into your browser:</p>
        <p style="color: #666; word-break: break-all;">${verifyUrl}</p>
        <hr />
        <p style="color: #999; font-size: 12px;">If you did not request this, you can safely ignore this email.</p>
      </div>
    `,
  };

  await sendEmail(mailOptions);
};

/**
 * Send trip reminder email (24 hours before departure)
 */
export const sendTripReminder = async (email, username, bookingDetails) => {
  console.log(
    `[TripReminder] Preparing to send trip reminder to ${email} for booking ${bookingDetails.bookingReference}`
  );
  console.log(
    `[TripReminder] Details - Departure: ${bookingDetails.departure}, Arrival: ${bookingDetails.arrival}, Date: ${bookingDetails.date}, Time: ${bookingDetails.time}`
  );

  const clientBase = process.env.CLIENT_URL || 'http://localhost:5173';
  const viewUrl = `${clientBase}/bus-booking/my-bookings`;

  const mailOptions = {
    from: `"QTechy Bus Booking" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: '🚌 Trip Reminder - Your Journey is Tomorrow!',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Trip Reminder</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td align="center" style="padding: 40px 0;">
              <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <!-- Header -->
                <tr>
                  <td style="padding: 40px 30px; background: linear-gradient(135deg, #ff6b6b 0%, #ff8787 100%); text-align: center;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px;">🚌 Trip Reminder</h1>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <p style="margin: 0 0 20px; font-size: 16px; color: #333;">Hi <strong>${username}</strong>,</p>
                    <p style="margin: 0 0 30px; font-size: 16px; color: #666;">
                      This is a friendly reminder that your journey is scheduled for <strong>tomorrow</strong>!
                    </p>
                    
                    <!-- Journey Details -->
                    <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 20px; margin-bottom: 30px;">
                      <h3 style="margin: 0 0 15px; color: #856404; font-size: 18px;">Journey Details</h3>
                      <table role="presentation" style="width: 100%;">
                        <tr>
                          <td style="padding: 5px 0;"><strong>Route:</strong></td>
                          <td style="padding: 5px 0; text-align: right;">${bookingDetails.departure} → ${bookingDetails.arrival}</td>
                        </tr>
                        <tr>
                          <td style="padding: 5px 0;"><strong>Date:</strong></td>
                          <td style="padding: 5px 0; text-align: right;">${bookingDetails.date}</td>
                        </tr>
                        <tr>
                          <td style="padding: 5px 0;"><strong>Departure Time:</strong></td>
                          <td style="padding: 5px 0; text-align: right; color: #dc3545; font-weight: bold;">${bookingDetails.time}</td>
                        </tr>
                        <tr>
                          <td style="padding: 5px 0;"><strong>Seat(s):</strong></td>
                          <td style="padding: 5px 0; text-align: right; font-weight: bold;">${bookingDetails.seatNo}</td>
                        </tr>
                        <tr>
                          <td style="padding: 5px 0;"><strong>Booking Ref:</strong></td>
                          <td style="padding: 5px 0; text-align: right; font-family: monospace;">${bookingDetails.bookingReference}</td>
                        </tr>
                      </table>
                    </div>
                    
                    <!-- Checklist -->
                    <div style="background-color: #d1ecf1; border-left: 4px solid #17a2b8; padding: 20px; margin-bottom: 30px;">
                      <h3 style="margin: 0 0 15px; color: #0c5460; font-size: 18px;">📋 Travel Checklist</h3>
                      <ul style="margin: 0; padding-left: 20px; color: #0c5460;">
                        <li style="margin-bottom: 8px;">Arrive at departure point at least 15 minutes early</li>
                        <li style="margin-bottom: 8px;">Carry a valid ID proof (license, passport, or Aadhar card)</li>
                        <li style="margin-bottom: 8px;">Keep your booking reference handy</li>
                        <li style="margin-bottom: 8px;">Check weather conditions and plan accordingly</li>
                      </ul>
                    </div>
                    
                    <!-- Action Button -->
                    <div style="text-align: center; margin: 30px 0;">
                      <a href="${viewUrl}" style="display: inline-block; padding: 15px 40px; background-color: #6d4aff; color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
                        View Booking Details
                      </a>
                    </div>
                    
                    <p style="margin: 30px 0 0; font-size: 16px; color: #666; text-align: center;">
                      Have a safe and pleasant journey! 🌟
                    </p>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="padding: 30px; background-color: #f8f9fa; text-align: center; border-top: 1px solid #e0e0e0;">
                    <p style="margin: 0 0 10px; font-size: 14px; color: #999;">
                      QTechy Bus Booking - Your trusted travel partner
                    </p>
                    <p style="margin: 0; font-size: 12px; color: #999;">
                      You received this email because you have an upcoming trip.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  };

  console.log(`[TripReminder] Calling sendEmail for ${email}...`);
  await sendEmail(mailOptions);
  console.log(`[TripReminder] ✅ Trip reminder email sent successfully to ${email}`);
};

/**
 * Send booking cancellation email
 */
export const sendBookingCancellation = async (email, username, bookingDetails) => {
  const mailOptions = {
    from: `"QTechy Bus Booking" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Booking Cancelled - QTechy Bus Booking',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Booking Cancelled</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td align="center" style="padding: 40px 0;">
              <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <!-- Header -->
                <tr>
                  <td style="padding: 40px 30px; background-color: #dc3545; text-align: center;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px;">Booking Cancelled</h1>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <p style="margin: 0 0 20px; font-size: 16px; color: #333;">Hi <strong>${username}</strong>,</p>
                    <p style="margin: 0 0 30px; font-size: 16px; color: #666;">
                      Your booking has been cancelled as per your request.
                    </p>
                    
                    <!-- Booking Details -->
                    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin-bottom: 30px;">
                      <p style="margin: 0 0 10px;"><strong>Booking Reference:</strong> ${bookingDetails.bookingReference}</p>
                      <p style="margin: 0 0 10px;"><strong>Route:</strong> ${bookingDetails.departure} → ${bookingDetails.arrival}</p>
                      <p style="margin: 0 0 10px;"><strong>Date:</strong> ${bookingDetails.date}</p>
                      <p style="margin: 0;"><strong>Refund Amount:</strong> Rs. ${bookingDetails.refundAmount || bookingDetails.totalPay}</p>
                    </div>
                    
                    <div style="background-color: #d1ecf1; border-left: 4px solid #17a2b8; padding: 15px; margin-bottom: 30px;">
                      <p style="margin: 0; font-size: 14px; color: #0c5460;">
                        <strong>ℹ️ Refund Information:</strong> Your refund will be processed within 5-7 business days and credited to your original payment method.
                      </p>
                    </div>
                    
                    <p style="margin: 0; font-size: 16px; color: #666;">
                      We hope to serve you again soon!
                    </p>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="padding: 30px; background-color: #f8f9fa; text-align: center; border-top: 1px solid #e0e0e0;">
                    <p style="margin: 0; font-size: 12px; color: #999;">
                      QTechy Bus Booking - Your trusted travel partner
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  };

  await sendEmail(mailOptions);
};

/**
 * Send test notification email
 */
export const sendTestNotification = async (email, username, notificationType = 'general') => {
  console.log('[TestEmail] Sending test notification to ' + email);
  const mailOptions = {
    from: 'QTechy Bus Booking <' + process.env.EMAIL_USER + '>',
    to: email,
    subject: ' Test ' + notificationType + ' Notification',
    html:
      '<h1>Test Email</h1><p>Hi ' +
      username +
      ', this is a test ' +
      notificationType +
      ' notification sent to ' +
      email +
      ' at ' +
      new Date().toLocaleString() +
      '</p><p>If you see this, your email notifications are working! </p>',
  };
  await sendEmail(mailOptions);
  console.log('[TestEmail]  Sent to ' + email);
};
