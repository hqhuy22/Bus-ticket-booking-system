import PropTypes from 'prop-types';

/**
 * Trip Status Badge Component
 * Displays trip status with appropriate styling
 */
export function TripStatusBadge({ status }) {
  const configs = {
    Scheduled: {
      bg: 'bg-blue-100',
      text: 'text-info-800',
      icon: '📅',
      label: 'Scheduled',
    },
    'In Progress': {
      bg: 'bg-yellow-100',
      text: 'text-yellow-800',
      icon: '🚌',
      label: 'In Transit',
    },
    Completed: {
      bg: 'bg-green-100',
      text: 'text-green-800',
      icon: '✓',
      label: 'Arrived',
    },
    Cancelled: {
      bg: 'bg-red-100',
      text: 'text-red-800',
      icon: '✗',
      label: 'Cancelled',
    },
  };

  const config = configs[status] || {
    bg: 'bg-gray-100',
    text: 'text-gray-800',
    icon: '❓',
    label: status || 'Unknown',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.text}`}
    >
      <span>{config.icon}</span>
      {config.label}
    </span>
  );
}

TripStatusBadge.propTypes = {
  status: PropTypes.string,
};

/**
 * Real-time Connection Indicator Component
 */
export function TripStatusIndicator({ isConnected, lastUpdate }) {
  return (
    <div className="flex items-center gap-2 text-xs text-gray-600">
      <div
        className={`w-2 h-2 rounded-full ${isConnected ? 'bg-success-500 animate-pulse' : 'bg-error-500'}`}
      />
      <span>
        {isConnected ? 'Live Updates' : 'Disconnected'}
        {lastUpdate &&
          ` • Updated ${new Date(lastUpdate).toLocaleTimeString()}`}
      </span>
    </div>
  );
}

TripStatusIndicator.propTypes = {
  isConnected: PropTypes.bool,
  lastUpdate: PropTypes.instanceOf(Date),
};

/**
 * Trip Timeline Component
 * Shows trip progress visually
 */
export function TripTimeline({ tripStatus }) {
  if (!tripStatus) return null;

  const getStepStatus = step => {
    if (tripStatus.tripStatus === 'Completed') return 'completed';
    if (tripStatus.tripStatus === 'In Progress') {
      return step === 'scheduled'
        ? 'completed'
        : step === 'in-progress'
          ? 'active'
          : 'pending';
    }
    if (tripStatus.tripStatus === 'Scheduled') {
      return step === 'scheduled' ? 'active' : 'pending';
    }
    return 'pending';
  };

  const steps = [
    { id: 'scheduled', label: 'Scheduled', icon: '📅' },
    { id: 'in-progress', label: 'In Transit', icon: '🚌' },
    { id: 'completed', label: 'Arrived', icon: '✓' },
  ];

  return (
    <div className="py-4">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const status = getStepStatus(step.id);
          const isActive = status === 'active';
          const isCompleted = status === 'completed';

          return (
            <div key={step.id} className="flex items-center flex-1">
              {/* Step Circle */}
              <div className="flex flex-col items-center">
                <div
                  className={`
                  w-10 h-10 rounded-full flex items-center justify-center text-lg font-semibold
                  ${isCompleted ? 'bg-success-500 text-white' : ''}
                  ${isActive ? 'bg-info-500 text-white animate-pulse' : ''}
                  ${status === 'pending' ? 'bg-gray-200 text-gray-500' : ''}
                `}
                >
                  {step.icon}
                </div>
                <span
                  className={`mt-2 text-xs font-medium ${
                    isActive || isCompleted ? 'text-gray-900' : 'text-gray-500'
                  }`}
                >
                  {step.label}
                </span>
              </div>

              {/* Connecting Line */}
              {index < steps.length - 1 && (
                <div
                  className={`flex-1 h-1 mx-2 ${
                    isCompleted ? 'bg-success-500' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

TripTimeline.propTypes = {
  tripStatus: PropTypes.shape({
    tripStatus: PropTypes.string,
  }),
};
