# Quick Reference Guide - Mock Data & Email System

## 🚀 Quick Commands

```bash
# Seed all mock data
npm run seed-mock

# Seed only admin
npm run seed-admin

# Reset database
npm run sync-db

# Run tests
npm test
```

---

## 📧 Email Templates - Quick Reference

### Usage Pattern

```javascript
import { renderEmailTemplate } from './config/emailTemplates.js';

const email = renderEmailTemplate('templateName', variables);
// Returns: { subject, html, category, priority }
```

### Available Templates

| Template | When to Send | Priority |
|----------|-------------|----------|
| `bookingConfirmation` | Payment confirmed | High |
| `tripReminder` | 24h before departure | High |
| `cancellation` | Booking cancelled | High |
| `welcomeEmail` | User registration | Medium |
| `passwordReset` | Password recovery | High |
| `promotion` | Marketing campaign | Low |
| `reviewRequest` | 2h after trip completion | Low |
| `paymentConfirmation` | Payment success | High |

### Example: Send Confirmation Email

```javascript
const emailData = renderEmailTemplate('bookingConfirmation', {
  customerName: customer.fullName,
  bookingReference: booking.bookingReference,
  departure: schedule.departure_city,
  arrival: schedule.arrival_city,
  journeyDate: booking.journeyDate,
  departureTime: booking.booking_startTime,
  seatNumbers: booking.seatNumbers.join(', '),
  pickupPoint: booking.pickupPoint,
  totalAmount: booking.payment_totalPay.toLocaleString('vi-VN'),
  viewBookingUrl: `${process.env.CLIENT_URL}/bookings/${booking.id}`
});

await sendEmail(customer.email, emailData.subject, emailData.html);
```

---

## 📋 Kanban Workflows - Quick Reference

### Get Workflow Configuration

```javascript
import { getWorkflowConfig } from './config/kanbanWorkflows.js';

const scheduleWorkflow = getWorkflowConfig('BusSchedule');
const bookingWorkflow = getWorkflowConfig('BusBooking');
const busWorkflow = getWorkflowConfig('Bus');
```

### Check Valid Transition

```javascript
import { canTransition } from './config/kanbanWorkflows.js';

if (canTransition(workflow, currentStatus, newStatus)) {
  // Allow transition
  await updateStatus(newStatus);
} else {
  // Show error
  throw new Error('Invalid status transition');
}
```

### Get Allowed Actions

```javascript
import { getAllowedActions } from './config/kanbanWorkflows.js';

const actions = getAllowedActions(workflow, schedule.status);
// Returns: ['edit-limited', 'cancel', 'mark-departed']

// Render action buttons
actions.forEach(action => renderButton(action));
```

### Status Colors

```javascript
const getStatusColor = (status) => {
  const column = workflow.columns.find(c => c.status === status);
  return {
    color: column.color,
    backgroundColor: column.backgroundColor,
    icon: column.icon
  };
};
```

---

## 🎫 Booking Workflow States

### State Transitions

```javascript
// Pending -> Confirmed (payment success)
async function confirmBooking(bookingId, paymentData) {
  const booking = await BusBooking.findByPk(bookingId);
  
  if (booking.status !== 'pending') {
    throw new Error('Booking must be pending');
  }
  
  await booking.update({ 
    status: 'confirmed',
    expiresAt: null 
  });
  
  // Send confirmation email
  await sendConfirmationEmail(booking);
  
  // Confirm seat locks
  await confirmSeatLocks(booking);
}

// Confirmed -> Cancelled (user cancellation)
async function cancelBooking(bookingId, reason) {
  const booking = await BusBooking.findByPk(bookingId);
  
  // Calculate refund
  const refund = calculateRefund(booking);
  
  await booking.update({ 
    status: 'cancelled',
    cancellationReason: reason,
    cancelledAt: new Date()
  });
  
  // Release seats
  await releaseSeats(booking);
  
  // Send cancellation email
  await sendCancellationEmail(booking, refund);
  
  // Process refund
  await processRefund(booking, refund);
}
```

### Refund Calculation

```javascript
function calculateRefund(booking) {
  const now = new Date();
  const departure = new Date(booking.journeyDate + ' ' + booking.booking_startTime);
  const hoursUntilDeparture = (departure - now) / (1000 * 60 * 60);
  
  const totalAmount = parseFloat(booking.payment_totalPay);
  
  if (hoursUntilDeparture > 24) {
    return totalAmount; // 100% refund
  } else if (hoursUntilDeparture > 12) {
    return totalAmount * 0.5; // 50% refund
  } else {
    return 0; // No refund
  }
}
```

---

## 📅 Schedule Workflow States

### Automated Status Updates

```javascript
// Cron job: Update schedules to "In Progress" on departure
async function checkScheduleDepartures() {
  const now = new Date();
  
  const departing = await BusSchedule.findAll({
    where: {
      status: 'Scheduled',
      departure_date: now.toISOString().split('T')[0],
      departure_time: {
        [Op.lte]: now.toTimeString().split(' ')[0]
      }
    }
  });
  
  for (const schedule of departing) {
    await schedule.update({ 
      status: 'In Progress',
      departedAt: new Date()
    });
    
    // Send departure notifications
    await notifyDeparture(schedule);
  }
}

// Cron job: Mark schedules as "Completed" on arrival
async function checkScheduleCompletions() {
  const now = new Date();
  
  const completing = await BusSchedule.findAll({
    where: {
      status: 'In Progress',
      arrival_date: now.toISOString().split('T')[0],
      arrival_time: {
        [Op.lte]: now.toTimeString().split(' ')[0]
      }
    }
  });
  
  for (const schedule of completing) {
    await schedule.update({ 
      status: 'Completed',
      isCompleted: true,
      completedAt: new Date()
    });
    
    // Update all bookings to completed
    await completeBookings(schedule);
    
    // Send review requests
    await sendReviewRequests(schedule);
  }
}
```

---

## 🔔 Automation Triggers

### Email Automations

```javascript
// Trigger reminder emails 24h before departure
async function sendTripReminders() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowDate = tomorrow.toISOString().split('T')[0];
  
  const bookings = await BusBooking.findAll({
    where: {
      status: 'confirmed',
      journeyDate: tomorrowDate,
      reminderSentAt: null
    },
    include: [Customer, BusSchedule]
  });
  
  for (const booking of bookings) {
    const email = renderEmailTemplate('tripReminder', {
      customerName: booking.Customer.fullName,
      bookingReference: booking.bookingReference,
      departure: booking.departure,
      arrival: booking.arrival,
      journeyDate: formatDate(booking.journeyDate),
      departureTime: booking.booking_startTime,
      depotName: booking.depotName,
      seatNumbers: booking.seatNumbers.join(', ')
    });
    
    await sendEmail(booking.Customer.email, email.subject, email.html);
    
    await booking.update({ reminderSentAt: new Date() });
  }
}

// Trigger review requests after trip completion
async function sendReviewRequests(schedule) {
  const bookings = await BusBooking.findAll({
    where: { 
      busScheduleId: schedule.id,
      status: 'completed'
    },
    include: [Customer]
  });
  
  for (const booking of bookings) {
    const email = renderEmailTemplate('reviewRequest', {
      customerName: booking.Customer.fullName,
      departure: booking.departure,
      arrival: booking.arrival,
      reviewUrl: `${process.env.CLIENT_URL}/bookings/${booking.id}/review`
    });
    
    await sendEmail(booking.Customer.email, email.subject, email.html);
  }
}
```

---

## 🎨 Frontend Integration Examples

### Kanban Board Component

```jsx
import { BOOKING_WORKFLOW } from '../config/kanbanWorkflows';

function BookingKanbanBoard({ bookings, onMoveBooking }) {
  const workflow = BOOKING_WORKFLOW;
  
  return (
    <div className="kanban-board">
      {workflow.columns.map(column => (
        <div 
          key={column.id}
          className="kanban-column"
          style={{ borderTopColor: column.color }}
        >
          <div className="column-header">
            <span className="icon">{column.icon}</span>
            <h3>{column.name}</h3>
            <span className="count">
              {bookings.filter(b => b.status === column.status).length}
            </span>
          </div>
          
          <div className="column-body">
            {bookings
              .filter(b => b.status === column.status)
              .map(booking => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  allowedActions={column.allowedActions}
                  onMove={(newStatus) => onMoveBooking(booking, newStatus)}
                />
              ))
            }
          </div>
        </div>
      ))}
    </div>
  );
}
```

### Status Badge Component

```jsx
function StatusBadge({ status, workflow }) {
  const column = workflow.columns.find(c => c.status === status);
  
  if (!column) return null;
  
  return (
    <span 
      className="status-badge"
      style={{
        color: column.color,
        backgroundColor: column.backgroundColor
      }}
    >
      <span className="icon">{column.icon}</span>
      {column.name}
    </span>
  );
}
```

---

## 🧪 Testing with Mock Data

### Get Test User

```javascript
const testUser = await Customer.findOne({
  where: { email: 'john.doe@gmail.com' }
});
```

### Get Test Schedule

```javascript
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);

const testSchedule = await BusSchedule.findOne({
  where: {
    departure_date: tomorrow.toISOString().split('T')[0],
    status: 'Scheduled'
  }
});
```

### Create Test Booking

```javascript
const testBooking = await BusBooking.create({
  customerId: testUser.id,
  busScheduleId: testSchedule.id,
  routeNo: testSchedule.routeNo,
  departure: testSchedule.departure_city,
  arrival: testSchedule.arrival_city,
  depotName: testSchedule.depotName,
  seatNumbers: [1, 2],
  booking_startTime: testSchedule.departure_time,
  booking_endTime: testSchedule.arrival_time,
  journeyDate: testSchedule.departure_date,
  status: 'pending',
  payment_busFare: 500000,
  payment_convenienceFee: 10000,
  payment_bankCharge: 3000,
  payment_totalPay: 513000,
  passengers: [
    { name: 'John Doe', age: 30, gender: 'Male', seatNumber: 1 },
    { name: 'Jane Doe', age: 28, gender: 'Female', seatNumber: 2 }
  ]
});
```

---

## 📊 Common Queries

### Active Schedules

```sql
SELECT * FROM bus_schedules 
WHERE status = 'Scheduled' 
AND departure_date >= CURRENT_DATE
ORDER BY departure_date, departure_time;
```

### Pending Bookings (About to Expire)

```sql
SELECT * FROM bus_bookings 
WHERE status = 'pending' 
AND "expiresAt" < NOW() + INTERVAL '5 minutes'
ORDER BY "expiresAt";
```

### Top Rated Schedules

```sql
SELECT 
  bs.*,
  AVG(r.rating) as avg_rating,
  COUNT(r.id) as review_count
FROM bus_schedules bs
LEFT JOIN reviews r ON r."busScheduleId" = bs.id
WHERE bs.status = 'Completed'
GROUP BY bs.id
HAVING COUNT(r.id) > 0
ORDER BY avg_rating DESC, review_count DESC
LIMIT 10;
```

---

## 🔧 Troubleshooting

### Reset Expired Bookings

```javascript
async function cleanupExpiredBookings() {
  const expired = await BusBooking.findAll({
    where: {
      status: 'pending',
      expiresAt: { [Op.lt]: new Date() }
    }
  });
  
  for (const booking of expired) {
    await booking.update({ status: 'expired' });
    await releaseSeatLocks(booking);
  }
}
```

### Fix Stuck Seat Locks

```javascript
async function releaseExpiredLocks() {
  const expiredLocks = await SeatLock.findAll({
    where: {
      status: 'locked',
      expiresAt: { [Op.lt]: new Date() }
    }
  });
  
  for (const lock of expiredLocks) {
    await lock.update({ status: 'expired' });
  }
}
```

---

**Last Updated**: January 2, 2026  
**Quick Reference for**: Mock Data, Email Templates, Kanban Workflows
