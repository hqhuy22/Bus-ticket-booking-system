/**
 * Email Templates Configuration
 * Centralized email templates for various system notifications
 */

export const EMAIL_TEMPLATES = {
  /**
   * Booking Confirmation Email
   */
  bookingConfirmation: {
    subject: 'Booking Confirmation - {bookingReference}',
    category: 'transactional',
    priority: 'high',
    template: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .detail-box { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
          .detail-label { font-weight: bold; color: #6b7280; }
          .detail-value { color: #111827; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
          .highlight { background: #fef3c7; padding: 15px; border-radius: 6px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚌 Booking Confirmed!</h1>
            <p>Your journey awaits</p>
          </div>
          <div class="content">
            <p>Dear <strong>{customerName}</strong>,</p>
            <p>Thank you for booking with us! Your bus ticket has been successfully confirmed.</p>
            
            <div class="detail-box">
              <h2 style="margin-top: 0; color: #667eea;">Booking Details</h2>
              <div class="detail-row">
                <span class="detail-label">Booking Reference:</span>
                <span class="detail-value"><strong>{bookingReference}</strong></span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Route:</span>
                <span class="detail-value">{departure} → {arrival}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Journey Date:</span>
                <span class="detail-value">{journeyDate}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Departure Time:</span>
                <span class="detail-value">{departureTime}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Seat Numbers:</span>
                <span class="detail-value">{seatNumbers}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Pickup Point:</span>
                <span class="detail-value">{pickupPoint}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Total Amount:</span>
                <span class="detail-value" style="color: #667eea; font-size: 18px;"><strong>{totalAmount} VND</strong></span>
              </div>
            </div>
            
            <div class="highlight">
              <strong>⏰ Important:</strong> Please arrive at the depot at least 15 minutes before departure time.
            </div>
            
            <div style="text-align: center;">
              <a href="{viewBookingUrl}" class="button">View Booking Details</a>
            </div>
            
            <div class="footer">
              <p>Questions? Contact us at support@busbook.com or call +84 123 456 789</p>
              <p>&copy; 2026 Bus Booking System. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
    variables: [
      'customerName',
      'bookingReference',
      'departure',
      'arrival',
      'journeyDate',
      'departureTime',
      'seatNumbers',
      'pickupPoint',
      'totalAmount',
      'viewBookingUrl',
    ],
  },

  /**
   * Trip Reminder Email (sent 24 hours before departure)
   */
  tripReminder: {
    subject: '⏰ Trip Reminder - Tomorrow at {departureTime}',
    category: 'reminder',
    priority: 'high',
    template: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .countdown { background: #fef3c7; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
          .countdown-time { font-size: 36px; font-weight: bold; color: #d97706; }
          .checklist { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .checklist-item { padding: 10px 0; display: flex; align-items: center; }
          .checklist-item::before { content: '✓'; background: #10b981; color: white; width: 24px; height: 24px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-right: 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⏰ Trip Reminder</h1>
            <p>Your journey is tomorrow!</p>
          </div>
          <div class="content">
            <p>Hi <strong>{customerName}</strong>,</p>
            <p>This is a friendly reminder about your upcoming bus trip tomorrow.</p>
            
            <div class="countdown">
              <div>Your bus departs in</div>
              <div class="countdown-time">24 Hours</div>
            </div>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">📋 Trip Details</h3>
              <p><strong>Booking Reference:</strong> {bookingReference}</p>
              <p><strong>Route:</strong> {departure} → {arrival}</p>
              <p><strong>Date:</strong> {journeyDate}</p>
              <p><strong>Departure Time:</strong> {departureTime}</p>
              <p><strong>Depot:</strong> {depotName}</p>
              <p><strong>Seats:</strong> {seatNumbers}</p>
            </div>
            
            <div class="checklist">
              <h3 style="margin-top: 0;">✅ Pre-Trip Checklist</h3>
              <div class="checklist-item">Arrive 15 minutes before departure</div>
              <div class="checklist-item">Bring your booking confirmation (print or digital)</div>
              <div class="checklist-item">Valid ID for verification</div>
              <div class="checklist-item">Check weather and dress accordingly</div>
              <div class="checklist-item">Charge your devices for the journey</div>
            </div>
            
            <div style="background: #dbeafe; padding: 15px; border-radius: 6px; border-left: 4px solid #3b82f6;">
              <strong>💡 Travel Tip:</strong> Download offline entertainment before your trip!
            </div>
            
            <div style="text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px;">
              <p>Have a safe and pleasant journey! 🚌</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
    variables: [
      'customerName',
      'bookingReference',
      'departure',
      'arrival',
      'journeyDate',
      'departureTime',
      'depotName',
      'seatNumbers',
    ],
  },

  /**
   * Booking Cancellation Email
   */
  cancellation: {
    subject: 'Booking Cancelled - {bookingReference}',
    category: 'transactional',
    priority: 'high',
    template: `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #ef4444; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1>Booking Cancelled</h1>
          </div>
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
            <p>Dear <strong>{customerName}</strong>,</p>
            <p>Your booking has been cancelled as requested.</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>Cancellation Details</h3>
              <p><strong>Booking Reference:</strong> {bookingReference}</p>
              <p><strong>Route:</strong> {departure} → {arrival}</p>
              <p><strong>Original Amount:</strong> {originalAmount} VND</p>
              <p><strong>Refund Amount:</strong> <span style="color: #10b981; font-size: 18px;"><strong>{refundAmount} VND</strong></span></p>
              <p><strong>Cancellation Reason:</strong> {cancellationReason}</p>
              <p><strong>Cancelled On:</strong> {cancelledDate}</p>
            </div>
            
            <div style="background: #fef3c7; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <strong>💰 Refund Processing:</strong> Your refund will be processed within 5-7 business days to your original payment method.
            </div>
            
            <p>We're sorry to see you cancel. We hope to serve you again soon!</p>
          </div>
        </div>
      </body>
      </html>
    `,
    variables: [
      'customerName',
      'bookingReference',
      'departure',
      'arrival',
      'originalAmount',
      'refundAmount',
      'cancellationReason',
      'cancelledDate',
    ],
  },

  /**
   * Welcome Email (after registration)
   */
  welcomeEmail: {
    subject: 'Welcome to Bus Booking System! 🚌',
    category: 'onboarding',
    priority: 'medium',
    template: `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0;">🚌 Welcome Aboard!</h1>
            <p style="margin: 10px 0 0 0; font-size: 18px;">Your journey begins here</p>
          </div>
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
            <p>Hi <strong>{customerName}</strong>,</p>
            <p>Thank you for joining Bus Booking System! We're excited to make your travel experience smooth and hassle-free.</p>
            
            <div style="background: #dbeafe; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
              <p style="margin: 0 0 15px 0;">Please verify your email address to get started:</p>
              <a href="{verificationLink}" style="display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">Verify Email Address</a>
            </div>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #667eea;">✨ Why Choose Us?</h3>
              <ul style="list-style: none; padding: 0;">
                <li style="padding: 8px 0;">✅ Easy online booking in minutes</li>
                <li style="padding: 8px 0;">✅ Safe and secure payment options</li>
                <li style="padding: 8px 0;">✅ Real-time seat availability</li>
                <li style="padding: 8px 0;">✅ 24/7 customer support</li>
                <li style="padding: 8px 0;">✅ Flexible cancellation policy</li>
                <li style="padding: 8px 0;">✅ Special discounts and offers</li>
              </ul>
            </div>
            
            <div style="background: #fef3c7; padding: 15px; border-radius: 6px;">
              <strong>🎉 First-Time Bonus:</strong> Use code <strong>WELCOME10</strong> for 10% off your first booking!
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
    variables: ['customerName', 'verificationLink'],
  },

  /**
   * Password Reset Email
   */
  passwordReset: {
    subject: 'Password Reset Request',
    category: 'security',
    priority: 'high',
    template: `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #6b7280; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1>🔐 Password Reset</h1>
          </div>
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
            <p>Hi <strong>{customerName}</strong>,</p>
            <p>We received a request to reset your password for your Bus Booking account.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="{resetLink}" style="display: inline-block; background: #667eea; color: white; padding: 15px 40px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">Reset Password</a>
            </div>
            
            <div style="background: #fee2e2; padding: 15px; border-radius: 6px; border-left: 4px solid #ef4444; margin: 20px 0;">
              <strong>⚠️ Security Note:</strong>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>This link will expire in <strong>1 hour</strong></li>
                <li>If you didn't request this, please ignore this email</li>
                <li>Your password won't change until you create a new one</li>
              </ul>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
              If the button doesn't work, copy and paste this link into your browser:<br>
              <code style="background: #e5e7eb; padding: 5px 10px; border-radius: 4px; display: inline-block; margin-top: 10px;">{resetLink}</code>
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
    variables: ['customerName', 'resetLink'],
  },

  /**
   * Promotional Email
   */
  promotion: {
    subject: '🎉 Special Offer - {discountPercent}% Off Your Next Trip!',
    category: 'marketing',
    priority: 'low',
    template: `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 40px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 32px;">🎉 Exclusive Offer!</h1>
            <p style="font-size: 24px; margin: 10px 0;"><strong>{discountPercent}% OFF</strong></p>
            <p style="margin: 0;">Your Next Journey</p>
          </div>
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
            <p>Hi <strong>{customerName}</strong>,</p>
            <p>Great news! We're offering you an exclusive discount on your next booking!</p>
            
            <div style="background: white; padding: 25px; border-radius: 8px; margin: 20px 0; border: 2px dashed #10b981;">
              <div style="text-align: center;">
                <p style="margin: 0; color: #6b7280;">Promo Code</p>
                <p style="font-size: 28px; font-weight: bold; color: #10b981; margin: 10px 0; letter-spacing: 2px;">{promoCode}</p>
                <p style="margin: 0; color: #6b7280;">Save {discountPercent}%</p>
              </div>
            </div>
            
            <div style="background: #dbeafe; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">📋 Offer Details</h3>
              <p><strong>Discount:</strong> {discountPercent}% off</p>
              <p><strong>Valid Until:</strong> {expiryDate}</p>
              <p><strong>Minimum Booking:</strong> {minAmount} VND</p>
              <p><strong>Valid Routes:</strong> {validRoutes}</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="{bookNowUrl}" style="display: inline-block; background: #10b981; color: white; padding: 15px 40px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">Book Now & Save!</a>
            </div>
            
            <p style="color: #6b7280; font-size: 12px; text-align: center;">
              Offer valid for single use only. Terms and conditions apply.
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
    variables: [
      'customerName',
      'discountPercent',
      'promoCode',
      'expiryDate',
      'minAmount',
      'validRoutes',
      'bookNowUrl',
    ],
  },

  /**
   * Review Request Email (after trip completion)
   */
  reviewRequest: {
    subject: 'How was your trip? Share your experience! ⭐',
    category: 'feedback',
    priority: 'low',
    template: `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1>⭐ Share Your Experience</h1>
          </div>
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
            <p>Hi <strong>{customerName}</strong>,</p>
            <p>We hope you had a great journey from <strong>{departure}</strong> to <strong>{arrival}</strong>!</p>
            <p>Your feedback helps us improve our service and helps other travelers make informed decisions.</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
              <p style="margin: 0 0 20px 0; font-size: 18px;"><strong>Rate your experience:</strong></p>
              <div style="font-size: 40px; margin: 20px 0;">⭐⭐⭐⭐⭐</div>
              <a href="{reviewUrl}" style="display: inline-block; background: #8b5cf6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">Write a Review</a>
            </div>
            
            <div style="background: #fef3c7; padding: 15px; border-radius: 6px;">
              <strong>🎁 Bonus:</strong> Complete your review and earn 50 loyalty points!
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
    variables: ['customerName', 'departure', 'arrival', 'reviewUrl'],
  },

  /**
   * Payment Confirmation Email
   */
  paymentConfirmation: {
    subject: 'Payment Successful - {bookingReference}',
    category: 'transactional',
    priority: 'high',
    template: `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #10b981; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1>✅ Payment Successful</h1>
          </div>
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
            <p>Dear <strong>{customerName}</strong>,</p>
            <p>We've received your payment for booking <strong>{bookingReference}</strong>.</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>💳 Payment Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr style="border-bottom: 1px solid #e5e7eb;">
                  <td style="padding: 10px 0;">Transaction ID:</td>
                  <td style="padding: 10px 0; text-align: right;"><strong>{transactionId}</strong></td>
                </tr>
                <tr style="border-bottom: 1px solid #e5e7eb;">
                  <td style="padding: 10px 0;">Payment Method:</td>
                  <td style="padding: 10px 0; text-align: right;">{paymentMethod}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e5e7eb;">
                  <td style="padding: 10px 0;">Payment Date:</td>
                  <td style="padding: 10px 0; text-align: right;">{paymentDate}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; font-size: 18px;">Total Amount:</td>
                  <td style="padding: 10px 0; text-align: right; color: #10b981; font-size: 20px;"><strong>{totalAmount} VND</strong></td>
                </tr>
              </table>
            </div>
            
            <div style="text-align: center; margin: 20px 0;">
              <a href="{receiptUrl}" style="display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px;">Download Receipt</a>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
    variables: [
      'customerName',
      'bookingReference',
      'transactionId',
      'paymentMethod',
      'paymentDate',
      'totalAmount',
      'receiptUrl',
    ],
  },
};

/**
 * Get email template by name
 */
export function getEmailTemplate(templateName) {
  return EMAIL_TEMPLATES[templateName] || null;
}

/**
 * Replace variables in email template
 */
export function renderEmailTemplate(templateName, variables) {
  const template = getEmailTemplate(templateName);
  if (!template) {
    throw new Error(`Email template '${templateName}' not found`);
  }

  let rendered = {
    subject: template.subject,
    html: template.template,
    category: template.category,
    priority: template.priority,
  };

  // Replace all variables in subject and body
  Object.keys(variables).forEach((key) => {
    const placeholder = new RegExp(`{${key}}`, 'g');
    rendered.subject = rendered.subject.replace(placeholder, variables[key]);
    rendered.html = rendered.html.replace(placeholder, variables[key]);
  });

  return rendered;
}

export default EMAIL_TEMPLATES;
