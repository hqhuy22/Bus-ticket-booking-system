import NotificationPreferences from '../models/NotificationPreferences.js';
import Customer from '../models/Customer.js';

/**
 * Get notification preferences for the authenticated user
 */
export const getNotificationPreferences = async (req, res) => {
  try {
    const customerId = req.user.id;

    let preferences = await NotificationPreferences.findOne({
      where: { customerId },
    });

    // Create default preferences if none exist
    if (!preferences) {
      preferences = await NotificationPreferences.create({
        customerId,
        emailBookingConfirmation: true,
        emailTripReminders: true,
        emailCancellations: true,
        emailPromotions: false,
        emailNewsletter: false,
        smsBookingConfirmation: false,
        smsTripReminders: false,
        smsCancellations: false,
        pushBookingConfirmation: true,
        pushTripReminders: true,
        pushPromotions: false,
        reminderTiming: 24,
        timezone: 'Asia/Kolkata',
      });
    }

    res.status(200).json({
      success: true,
      preferences,
    });
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notification preferences',
      error: error.message,
    });
  }
};

/**
 * Update notification preferences for the authenticated user
 */
export const updateNotificationPreferences = async (req, res) => {
  try {
    const customerId = req.user.id;
    const updates = req.body;

    // Validate allowed fields
    const allowedFields = [
      'emailBookingConfirmation',
      'emailTripReminders',
      'emailCancellations',
      'emailPromotions',
      'emailNewsletter',
      'smsBookingConfirmation',
      'smsTripReminders',
      'smsCancellations',
      'pushBookingConfirmation',
      'pushTripReminders',
      'pushPromotions',
      'phoneNumber',
      'reminderTiming',
      'timezone',
    ];

    const filteredUpdates = {};
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        filteredUpdates[field] = updates[field];
      }
    }

    // Validate reminderTiming if provided
    if (
      filteredUpdates.reminderTiming &&
      ![1, 3, 6, 12, 24, 48].includes(filteredUpdates.reminderTiming)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reminder timing. Must be 1, 3, 6, 12, 24, or 48 hours.',
      });
    }

    let preferences = await NotificationPreferences.findOne({
      where: { customerId },
    });

    if (preferences) {
      // Update existing preferences
      await preferences.update(filteredUpdates);
    } else {
      // Create new preferences with updates
      preferences = await NotificationPreferences.create({
        customerId,
        ...filteredUpdates,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Notification preferences updated successfully',
      preferences,
    });
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update notification preferences',
      error: error.message,
    });
  }
};

/**
 * Reset notification preferences to defaults
 */
export const resetNotificationPreferences = async (req, res) => {
  try {
    const customerId = req.user.id;

    const defaultPreferences = {
      emailBookingConfirmation: true,
      emailTripReminders: true,
      emailCancellations: true,
      emailPromotions: false,
      emailNewsletter: false,
      smsBookingConfirmation: false,
      smsTripReminders: false,
      smsCancellations: false,
      pushBookingConfirmation: true,
      pushTripReminders: true,
      pushPromotions: false,
      phoneNumber: null,
      reminderTiming: 24,
      timezone: 'Asia/Kolkata',
    };

    let preferences = await NotificationPreferences.findOne({
      where: { customerId },
    });

    if (preferences) {
      await preferences.update(defaultPreferences);
    } else {
      preferences = await NotificationPreferences.create({
        customerId,
        ...defaultPreferences,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Notification preferences reset to defaults',
      preferences,
    });
  } catch (error) {
    console.error('Error resetting notification preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset notification preferences',
      error: error.message,
    });
  }
};

/**
 * Check if a specific notification type is enabled for a customer
 */
export const checkNotificationEnabled = async (customerId, notificationType) => {
  try {
    const preferences = await NotificationPreferences.findOne({
      where: { customerId },
    });

    if (!preferences) {
      // Return default values if no preferences exist
      const defaults = {
        emailBookingConfirmation: true,
        emailTripReminders: true,
        emailCancellations: true,
        emailPromotions: false,
        smsBookingConfirmation: false,
        smsTripReminders: false,
        smsCancellations: false,
      };
      return defaults[notificationType] || false;
    }

    return preferences[notificationType] || false;
  } catch (error) {
    console.error('Error checking notification preference:', error);
    return false; // Default to disabled on error
  }
};

/**
 * Test email notification (sends to user's own email for testing)
 */
export const testEmailNotification = async (req, res) => {
  try {
    const customerId = req.user.id;
    const { notificationType } = req.body;

    const customer = await Customer.findByPk(customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }

    // Import email function
    const { sendTestNotification } = await import('../utils/email.js');

    // Send test email to user's own email
    await sendTestNotification(customer.email, customer.username, notificationType || 'general');

    res.status(200).json({
      success: true,
      message: `Test ${notificationType || 'general'} notification sent to your email: ${customer.email}`,
    });
  } catch (error) {
    console.error('Test email notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending test notification',
      error: error.message,
    });
  }
};
