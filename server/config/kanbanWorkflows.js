/**
 * Kanban Workflow Configurations
 * Define workflow states and transitions for various entities
 */

/**
 * Bus Schedule Management Workflow
 */
export const SCHEDULE_WORKFLOW = {
  name: 'Bus Schedule Management',
  description: 'Track bus schedule lifecycle from planning to completion',
  entity: 'BusSchedule',

  columns: [
    {
      id: 'draft',
      name: 'Draft',
      color: '#94a3b8',
      backgroundColor: '#f1f5f9',
      order: 1,
      status: 'draft',
      icon: '📝',
      description: 'Schedules being planned',
      rules: [
        'Can edit all details',
        'Not visible to customers',
        'No bookings allowed',
        'Can be deleted',
      ],
      allowedActions: ['edit', 'delete', 'publish'],
      automations: [],
    },
    {
      id: 'scheduled',
      name: 'Scheduled',
      color: '#3b82f6',
      backgroundColor: '#dbeafe',
      order: 2,
      status: 'Scheduled',
      icon: '📅',
      description: 'Published schedules ready for booking',
      rules: [
        'Visible to customers',
        'Bookings accepted',
        'Limited editing (price, seats)',
        'Can cancel with notification',
      ],
      allowedActions: ['edit-limited', 'cancel', 'mark-departed'],
      automations: [
        {
          trigger: 'on_publish',
          action: 'notify_subscribers',
          description: 'Notify users about new schedule',
        },
        {
          trigger: 'before_departure',
          action: 'send_reminders',
          timing: '24_hours',
          description: 'Send trip reminders to booked passengers',
        },
      ],
    },
    {
      id: 'in-progress',
      name: 'In Progress',
      color: '#f59e0b',
      backgroundColor: '#fef3c7',
      order: 3,
      status: 'In Progress',
      icon: '🚌',
      description: 'Trip has departed and is en route',
      rules: [
        'No new bookings allowed',
        'Cannot be cancelled',
        'Read-only for most fields',
        'Track real-time status',
      ],
      allowedActions: ['track', 'mark-completed', 'emergency-cancel'],
      automations: [
        {
          trigger: 'on_departure',
          action: 'update_status',
          description: 'Mark as departed and record time',
        },
        {
          trigger: 'on_departure',
          action: 'lock_bookings',
          description: 'Prevent any modifications',
        },
      ],
    },
    {
      id: 'completed',
      name: 'Completed',
      color: '#10b981',
      backgroundColor: '#d1fae5',
      order: 4,
      status: 'Completed',
      icon: '✅',
      description: 'Trip finished successfully',
      rules: [
        'Read-only - no modifications',
        'Enable review system',
        'Generate revenue reports',
        'Archive after 90 days',
      ],
      allowedActions: ['view', 'generate-report', 'request-reviews'],
      automations: [
        {
          trigger: 'on_completion',
          action: 'update_bookings',
          description: 'Mark all bookings as completed',
        },
        {
          trigger: 'after_completion',
          action: 'request_reviews',
          timing: '2_hours',
          description: 'Send review requests to passengers',
        },
        {
          trigger: 'after_completion',
          action: 'generate_analytics',
          timing: '1_day',
          description: 'Generate performance analytics',
        },
      ],
    },
    {
      id: 'cancelled',
      name: 'Cancelled',
      color: '#ef4444',
      backgroundColor: '#fee2e2',
      order: 5,
      status: 'Cancelled',
      icon: '❌',
      description: 'Trip was cancelled',
      rules: [
        'Read-only except cancellation notes',
        'Process refunds automatically',
        'Show cancellation reason',
        'Notify all passengers',
      ],
      allowedActions: ['view', 'add-notes'],
      automations: [
        {
          trigger: 'on_cancellation',
          action: 'notify_passengers',
          description: 'Send cancellation emails to all booked passengers',
        },
        {
          trigger: 'on_cancellation',
          action: 'process_refunds',
          description: 'Initiate refund process for confirmed bookings',
        },
        {
          trigger: 'on_cancellation',
          action: 'release_bus',
          description: 'Mark bus as available for other schedules',
        },
      ],
    },
  ],

  transitions: {
    'draft -> scheduled': {
      name: 'Publish Schedule',
      icon: '🚀',
      validations: [
        'All required fields filled',
        'Bus is available',
        'Route exists',
        'Price is set',
        'Future departure date',
      ],
      action: 'publish',
      confirmationRequired: true,
      confirmationMessage:
        'Are you sure you want to publish this schedule? It will be visible to customers.',
    },
    'scheduled -> in-progress': {
      name: 'Mark as Departed',
      icon: '🚦',
      validations: ['Current time is close to departure', 'Has at least one booking'],
      action: 'depart',
      confirmationRequired: true,
      confirmationMessage: 'Confirm that the bus has departed?',
    },
    'scheduled -> cancelled': {
      name: 'Cancel Schedule',
      icon: '🚫',
      validations: ['Cancellation reason provided'],
      action: 'cancel',
      confirmationRequired: true,
      confirmationMessage: 'This will cancel the schedule and notify all passengers. Continue?',
      requiresInput: {
        field: 'cancellationReason',
        label: 'Cancellation Reason',
        type: 'textarea',
        required: true,
      },
    },
    'in-progress -> completed': {
      name: 'Mark as Completed',
      icon: '🏁',
      validations: ['Trip duration has passed'],
      action: 'complete',
      confirmationRequired: true,
      confirmationMessage: 'Confirm that the trip has been completed?',
    },
    'in-progress -> cancelled': {
      name: 'Emergency Cancellation',
      icon: '🚨',
      validations: ['Emergency reason provided'],
      action: 'emergency_cancel',
      confirmationRequired: true,
      confirmationMessage:
        '⚠️ EMERGENCY: This will cancel an in-progress trip. Only for critical situations!',
      requiresInput: {
        field: 'cancellationReason',
        label: 'Emergency Reason',
        type: 'textarea',
        required: true,
      },
    },
  },

  metrics: [
    {
      name: 'Total Schedules',
      calculation: 'count_all',
    },
    {
      name: 'Active Schedules',
      calculation: 'count_by_status',
      status: ['Scheduled', 'In Progress'],
    },
    {
      name: 'Completion Rate',
      calculation: 'percentage',
      numerator: 'completed',
      denominator: 'total_finished',
    },
    {
      name: 'Cancellation Rate',
      calculation: 'percentage',
      numerator: 'cancelled',
      denominator: 'total_finished',
    },
  ],
};

/**
 * Booking Management Workflow
 */
export const BOOKING_WORKFLOW = {
  name: 'Booking Management',
  description: 'Track customer bookings from creation to completion',
  entity: 'BusBooking',

  columns: [
    {
      id: 'pending',
      name: 'Pending Payment',
      color: '#fbbf24',
      backgroundColor: '#fef3c7',
      order: 1,
      status: 'pending',
      icon: '⏳',
      description: 'Awaiting payment confirmation',
      rules: [
        '15-minute expiry timer',
        'Seats temporarily locked',
        'Can be cancelled without penalty',
        'Auto-expire if unpaid',
      ],
      allowedActions: ['pay', 'cancel', 'view'],
      automations: [
        {
          trigger: 'on_create',
          action: 'lock_seats',
          description: 'Lock selected seats for 15 minutes',
        },
        {
          trigger: 'on_create',
          action: 'start_timer',
          duration: '15_minutes',
          description: 'Start countdown timer',
        },
        {
          trigger: 'timer_expired',
          action: 'expire_booking',
          description: 'Auto-expire and release seats',
        },
      ],
    },
    {
      id: 'confirmed',
      name: 'Confirmed',
      color: '#22c55e',
      backgroundColor: '#d1fae5',
      order: 2,
      status: 'confirmed',
      icon: '✅',
      description: 'Payment confirmed, ticket issued',
      rules: [
        'Ticket generated',
        'Seats permanently booked',
        'Can cancel with fee (time-based)',
        'Eligible for modifications',
      ],
      allowedActions: ['view', 'cancel', 'modify', 'download-ticket'],
      automations: [
        {
          trigger: 'on_confirmation',
          action: 'send_confirmation_email',
          description: 'Send booking confirmation with ticket',
        },
        {
          trigger: 'on_confirmation',
          action: 'confirm_seat_lock',
          description: 'Permanently reserve seats',
        },
        {
          trigger: 'on_confirmation',
          action: 'update_schedule_seats',
          description: 'Decrease available seats count',
        },
        {
          trigger: 'before_departure',
          action: 'send_reminder',
          timing: '24_hours',
          description: 'Send trip reminder',
        },
      ],
    },
    {
      id: 'completed',
      name: 'Completed',
      color: '#3b82f6',
      backgroundColor: '#dbeafe',
      order: 3,
      status: 'completed',
      icon: '🎉',
      description: 'Trip completed successfully',
      rules: ['Read-only', 'Can request review', 'Eligible for loyalty points', 'Generate receipt'],
      allowedActions: ['view', 'download-receipt', 'write-review'],
      automations: [
        {
          trigger: 'on_completion',
          action: 'award_loyalty_points',
          description: 'Add loyalty points to customer account',
        },
        {
          trigger: 'after_completion',
          action: 'request_review',
          timing: '2_hours',
          description: 'Send review request email',
        },
        {
          trigger: 'on_completion',
          action: 'generate_analytics',
          description: 'Update booking statistics',
        },
      ],
    },
    {
      id: 'cancelled',
      name: 'Cancelled',
      color: '#ef4444',
      backgroundColor: '#fee2e2',
      order: 4,
      status: 'cancelled',
      icon: '❌',
      description: 'Booking cancelled by user or system',
      rules: [
        'Read-only',
        'Refund processing based on policy',
        'Seats released back to pool',
        'Show cancellation details',
      ],
      allowedActions: ['view', 'track-refund'],
      automations: [
        {
          trigger: 'on_cancellation',
          action: 'release_seats',
          description: 'Return seats to available pool',
        },
        {
          trigger: 'on_cancellation',
          action: 'calculate_refund',
          description: 'Calculate refund based on cancellation policy',
        },
        {
          trigger: 'on_cancellation',
          action: 'send_cancellation_email',
          description: 'Send cancellation confirmation',
        },
        {
          trigger: 'after_cancellation',
          action: 'process_refund',
          timing: '1_hour',
          description: 'Initiate refund to payment method',
        },
      ],
    },
    {
      id: 'expired',
      name: 'Expired',
      color: '#6b7280',
      backgroundColor: '#f3f4f6',
      order: 5,
      status: 'expired',
      icon: '⏰',
      description: 'Payment not completed in time',
      rules: [
        'Read-only',
        'No refund (nothing was paid)',
        'Seats released',
        'Auto-deleted after 24 hours',
      ],
      allowedActions: ['view'],
      automations: [
        {
          trigger: 'on_expiry',
          action: 'release_seat_locks',
          description: 'Remove temporary seat locks',
        },
        {
          trigger: 'on_expiry',
          action: 'send_expiry_notification',
          description: 'Notify user about expiration',
        },
        {
          trigger: 'after_expiry',
          action: 'delete_booking',
          timing: '24_hours',
          description: 'Clean up expired bookings',
        },
      ],
    },
  ],

  transitions: {
    'pending -> confirmed': {
      name: 'Confirm Payment',
      icon: '💳',
      validations: ['Payment successful', 'Seats still available'],
      action: 'confirm',
      confirmationRequired: false,
      automated: true,
    },
    'pending -> expired': {
      name: 'Expire Booking',
      icon: '⏰',
      validations: ['Timer expired', 'Payment not received'],
      action: 'expire',
      confirmationRequired: false,
      automated: true,
    },
    'pending -> cancelled': {
      name: 'Cancel Booking',
      icon: '❌',
      validations: [],
      action: 'cancel',
      confirmationRequired: true,
      confirmationMessage: 'Cancel this booking?',
    },
    'confirmed -> completed': {
      name: 'Complete Trip',
      icon: '🏁',
      validations: ['Schedule is completed'],
      action: 'complete',
      confirmationRequired: false,
      automated: true,
    },
    'confirmed -> cancelled': {
      name: 'Cancel Booking',
      icon: '🚫',
      validations: [],
      action: 'cancel',
      confirmationRequired: true,
      confirmationMessage: 'Cancel this booking? Refund will be processed according to our policy.',
      requiresInput: {
        field: 'cancellationReason',
        label: 'Reason for Cancellation (Optional)',
        type: 'textarea',
        required: false,
      },
    },
  },

  refundPolicy: {
    rules: [
      {
        condition: 'More than 24 hours before departure',
        refundPercentage: 100,
        description: 'Full refund',
      },
      {
        condition: '12-24 hours before departure',
        refundPercentage: 50,
        description: '50% refund',
      },
      {
        condition: 'Less than 12 hours before departure',
        refundPercentage: 0,
        description: 'No refund',
      },
    ],
  },

  metrics: [
    {
      name: 'Total Bookings',
      calculation: 'count_all',
    },
    {
      name: 'Confirmed Rate',
      calculation: 'percentage',
      numerator: 'confirmed',
      denominator: 'total_created',
    },
    {
      name: 'Expiry Rate',
      calculation: 'percentage',
      numerator: 'expired',
      denominator: 'pending',
    },
    {
      name: 'Cancellation Rate',
      calculation: 'percentage',
      numerator: 'cancelled',
      denominator: 'confirmed',
    },
    {
      name: 'Average Booking Value',
      calculation: 'average',
      field: 'payment_totalPay',
    },
  ],
};

/**
 * Bus Maintenance Workflow
 */
export const BUS_MAINTENANCE_WORKFLOW = {
  name: 'Bus Maintenance Tracking',
  description: 'Manage bus maintenance and availability status',
  entity: 'Bus',

  columns: [
    {
      id: 'active',
      name: 'Active',
      color: '#10b981',
      backgroundColor: '#d1fae5',
      order: 1,
      status: 'active',
      icon: '✅',
      description: 'Bus is operational and available',
      rules: [
        'Can be scheduled for trips',
        'All systems operational',
        'Regular safety checks passed',
      ],
      allowedActions: ['schedule', 'view', 'schedule-maintenance'],
    },
    {
      id: 'scheduled-maintenance',
      name: 'Scheduled Maintenance',
      color: '#f59e0b',
      backgroundColor: '#fef3c7',
      order: 2,
      status: 'scheduled-maintenance',
      icon: '📅',
      description: 'Maintenance scheduled for future date',
      rules: [
        'No new schedules after maintenance date',
        'Notify affected bookings',
        'Can reschedule maintenance',
      ],
      allowedActions: ['view', 'reschedule', 'start-maintenance'],
    },
    {
      id: 'maintenance',
      name: 'Under Maintenance',
      color: '#ef4444',
      backgroundColor: '#fee2e2',
      order: 3,
      status: 'maintenance',
      icon: '🔧',
      description: 'Bus is currently being serviced',
      rules: ['Cannot be scheduled', 'Track repair progress', 'Log maintenance activities'],
      allowedActions: ['view', 'log-activity', 'complete-maintenance'],
    },
    {
      id: 'inspection',
      name: 'Safety Inspection',
      color: '#8b5cf6',
      backgroundColor: '#ede9fe',
      order: 4,
      status: 'inspection',
      icon: '🔍',
      description: 'Safety inspection in progress',
      rules: [
        'Cannot be scheduled',
        'Certification required to pass',
        'Must complete before returning to active',
      ],
      allowedActions: ['view', 'upload-certificate', 'pass-inspection', 'fail-inspection'],
    },
    {
      id: 'retired',
      name: 'Retired',
      color: '#6b7280',
      backgroundColor: '#f3f4f6',
      order: 5,
      status: 'retired',
      icon: '📦',
      description: 'Bus decommissioned from service',
      rules: ['Read-only', 'Historical data only', 'Cannot be reactivated'],
      allowedActions: ['view'],
    },
  ],

  transitions: {
    'active -> scheduled-maintenance': {
      name: 'Schedule Maintenance',
      icon: '📅',
      validations: ['Future date selected'],
      action: 'schedule_maintenance',
      requiresInput: {
        field: 'maintenanceDate',
        label: 'Maintenance Date',
        type: 'date',
        required: true,
      },
    },
    'scheduled-maintenance -> maintenance': {
      name: 'Begin Maintenance',
      icon: '🔧',
      validations: [],
      action: 'start_maintenance',
    },
    'maintenance -> inspection': {
      name: 'Send for Inspection',
      icon: '🔍',
      validations: ['Maintenance work completed'],
      action: 'start_inspection',
    },
    'inspection -> active': {
      name: 'Pass Inspection',
      icon: '✅',
      validations: ['Inspection certificate uploaded'],
      action: 'pass_inspection',
    },
    'inspection -> maintenance': {
      name: 'Fail Inspection',
      icon: '❌',
      validations: [],
      action: 'fail_inspection',
      requiresInput: {
        field: 'failureReason',
        label: 'Failure Reason',
        type: 'textarea',
        required: true,
      },
    },
    'active -> retired': {
      name: 'Retire Bus',
      icon: '📦',
      validations: [],
      action: 'retire',
      confirmationRequired: true,
      confirmationMessage: 'This will permanently retire the bus. Continue?',
    },
  },

  metrics: [
    {
      name: 'Active Buses',
      calculation: 'count_by_status',
      status: 'active',
    },
    {
      name: 'Under Maintenance',
      calculation: 'count_by_status',
      status: ['maintenance', 'inspection'],
    },
    {
      name: 'Average Maintenance Days',
      calculation: 'average_duration',
      statuses: ['maintenance', 'inspection'],
    },
  ],
};

/**
 * Get workflow configuration by entity type
 */
export function getWorkflowConfig(entity) {
  const workflows = {
    BusSchedule: SCHEDULE_WORKFLOW,
    BusBooking: BOOKING_WORKFLOW,
    Bus: BUS_MAINTENANCE_WORKFLOW,
  };

  return workflows[entity] || null;
}

/**
 * Validate if transition is allowed
 */
export function canTransition(workflow, fromStatus, toStatus) {
  const transitionKey = `${fromStatus} -> ${toStatus}`;
  return Object.prototype.hasOwnProperty.call(workflow.transitions, transitionKey);
}

/**
 * Get allowed actions for a status
 */
export function getAllowedActions(workflow, status) {
  const column = workflow.columns.find((col) => col.status === status);
  return column ? column.allowedActions : [];
}

export default {
  SCHEDULE_WORKFLOW,
  BOOKING_WORKFLOW,
  BUS_MAINTENANCE_WORKFLOW,
  getWorkflowConfig,
  canTransition,
  getAllowedActions,
};
