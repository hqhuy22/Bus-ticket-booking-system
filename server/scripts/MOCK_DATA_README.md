# Database Mock Data & Configuration System

This directory contains comprehensive mock data, email templates, and workflow configurations for the Bus Ticket Booking System.

## 📁 Files Overview

### 1. `seed_mock_data.js`
Complete database seeding script with realistic sample data.

**Features:**
- ✅ Sample users (admin, customers, OAuth users)
- ✅ Bus fleet with different types (AC Sleeper, Semi-Sleeper, Normal)
- ✅ Routes with multiple stops
- ✅ Bus schedules for next 14 days
- ✅ Bookings in various states (confirmed, pending, cancelled, completed)
- ✅ Reviews and ratings
- ✅ Chat history samples
- ✅ Notification preferences
- ✅ Active seat locks

### 2. `emailTemplates.js`
Professional email templates for all system notifications.

**Templates Available:**
- 📧 **Booking Confirmation** - Sent when booking is confirmed
- ⏰ **Trip Reminder** - Sent 24 hours before departure
- ❌ **Cancellation** - Booking cancellation notification
- 🎉 **Welcome Email** - New user registration
- 🔐 **Password Reset** - Password recovery
- 💰 **Promotion** - Marketing campaigns
- ⭐ **Review Request** - Post-trip feedback request
- 💳 **Payment Confirmation** - Transaction success

### 3. `kanbanWorkflows.js`
Workflow state management for schedules, bookings, and buses.

**Workflows:**
- 📅 **Schedule Workflow** - Draft → Scheduled → In Progress → Completed/Cancelled
- 🎫 **Booking Workflow** - Pending → Confirmed → Completed/Cancelled/Expired
- 🚌 **Bus Maintenance** - Active → Maintenance → Inspection → Active/Retired

## 🚀 Quick Start

### Running the Seeder

```bash
# Navigate to server directory
cd bus-booking-server

# Run the seeding script
node scripts/seed_mock_data.js
```

### Expected Output

```
🌱 Starting database seeding...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Database connection established

📧 Seeding users...
  ✅ Created user: admin@busbook.com
  ✅ Created user: john.doe@gmail.com
  ...

🚌 Seeding buses...
  ✅ Created bus: VN-001 (29A-12345)
  ...

📊 SEEDING SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👥 Users: 6
🚌 Buses: 5
🛣️  Routes: 4
📅 Schedules: 50+
🎫 Bookings: 10+
```

## 📧 Using Email Templates

### Example: Send Booking Confirmation

```javascript
import { renderEmailTemplate } from '../config/emailTemplates.js';

const emailData = renderEmailTemplate('bookingConfirmation', {
  customerName: 'John Doe',
  bookingReference: 'BKG-ABC123',
  departure: 'Hanoi',
  arrival: 'Ho Chi Minh City',
  journeyDate: '2026-01-15',
  departureTime: '06:00 AM',
  seatNumbers: '1, 2',
  pickupPoint: 'Hanoi Central Station',
  totalAmount: '1,700,000',
  viewBookingUrl: 'https://busbook.com/bookings/BKG-ABC123'
});

// Send email
await sendEmail({
  to: 'customer@example.com',
  subject: emailData.subject,
  html: emailData.html
});
```

### Available Template Variables

Each template has specific variables. Check `emailTemplates.js` for the full list of variables per template.

## 📋 Using Kanban Workflows

### Example: Get Schedule Workflow

```javascript
import { getWorkflowConfig, canTransition } from '../config/kanbanWorkflows.js';

// Get workflow configuration
const workflow = getWorkflowConfig('BusSchedule');

// Check if transition is allowed
const allowed = canTransition(workflow, 'Scheduled', 'In Progress');
// Returns: true

// Get allowed actions for a status
const actions = getAllowedActions(workflow, 'Scheduled');
// Returns: ['edit-limited', 'cancel', 'mark-departed']
```

### Workflow States

#### Schedule Workflow
1. **Draft** 📝 - Planning stage, not visible to customers
2. **Scheduled** 📅 - Published, accepting bookings
3. **In Progress** 🚌 - Bus departed, trip ongoing
4. **Completed** ✅ - Trip finished successfully
5. **Cancelled** ❌ - Trip cancelled

#### Booking Workflow
1. **Pending** ⏳ - Awaiting payment (15 min timer)
2. **Confirmed** ✅ - Payment received, ticket issued
3. **Completed** 🎉 - Trip finished
4. **Cancelled** ❌ - Booking cancelled
5. **Expired** ⏰ - Payment timeout

#### Bus Maintenance Workflow
1. **Active** ✅ - Operational, can be scheduled
2. **Scheduled Maintenance** 📅 - Maintenance planned
3. **Under Maintenance** 🔧 - Being serviced
4. **Safety Inspection** 🔍 - Quality check
5. **Retired** 📦 - Decommissioned

## 🔑 Test User Credentials

After running the seeder, you can log in with these accounts:

### Admin Account
```
Email: admin@busbook.com
Password: Admin@123
Role: Administrator
```

### Customer Accounts
```
Email: john.doe@gmail.com
Password: User@123
Name: John Doe
```

```
Email: jane.smith@gmail.com
Password: User@123
Name: Jane Smith
```

```
Email: nguyen.van.a@gmail.com
Password: User@123
Name: Nguyễn Văn A
```

### OAuth User (Google)
```
Email: googleuser@gmail.com
Provider: Google OAuth
Note: Use Google login flow
```

## 📊 Sample Data Overview

### Buses (5 total)
- **VN-001** - AC Sleeper (Mercedes-Benz) - 40 seats
- **VN-002** - AC Semi-Sleeper (Volvo) - 45 seats
- **VN-003** - Normal Seater (Hyundai) - 50 seats
- **VN-004** - VIP Sleeper (Scania) - 30 seats
- **VN-005** - AC Sleeper (Mercedes) - Under maintenance

### Routes (4 total)
1. **Route 101** - Hanoi → Ho Chi Minh City (1720 km, 24h)
2. **Route 102** - Hanoi → Da Nang (764 km, 14h)
3. **Route 201** - Ho Chi Minh → Nha Trang (448 km, 8h)
4. **Route 103** - Hanoi → Hai Phong (120 km, 2h)

### Schedules
- 50+ schedules created for next 14 days
- Multiple daily departures on popular routes
- Various bus types and price points
- Mix of daytime and overnight trips

### Bookings
- Confirmed bookings with seat assignments
- Pending bookings (awaiting payment)
- Cancelled bookings (with refund processing)
- Completed bookings (eligible for reviews)
- Expired bookings (payment timeout)

## 🔄 Resetting the Database

To clear and reseed the database:

```bash
# Option 1: Drop and recreate tables (⚠️ DESTROYS ALL DATA)
psql -U postgres -d bus_booking_db -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# Option 2: Use migration scripts
npm run sync-db

# Then reseed
node scripts/seed_mock_data.js
```

## 🧪 Testing with Mock Data

### Test Scenarios Included

1. **Happy Path Booking**
   - User: john.doe@gmail.com
   - Status: Confirmed
   - Schedule: Hanoi → HCM tomorrow

2. **Pending Payment**
   - User: jane.smith@gmail.com
   - Status: Pending (will expire in 5 min)
   - Schedule: Hanoi → Da Nang

3. **Cancelled Booking**
   - User: nguyen.van.a@gmail.com
   - Status: Cancelled
   - Reason: Change of travel plans

4. **Completed Trip**
   - User: tran.thi.b@gmail.com
   - Status: Completed
   - Eligible for review

## 📝 Customization

### Adding New Email Templates

1. Open `config/emailTemplates.js`
2. Add new template to `EMAIL_TEMPLATES` object:

```javascript
export const EMAIL_TEMPLATES = {
  // ... existing templates
  
  myNewTemplate: {
    subject: 'My Subject - {variable}',
    category: 'transactional',
    priority: 'high',
    template: `
      <!-- Your HTML here -->
      <p>Hello {customerName}</p>
    `,
    variables: ['customerName', 'variable']
  }
};
```

### Modifying Workflows

1. Open `config/kanbanWorkflows.js`
2. Edit workflow columns, transitions, or add new workflows
3. Update validation rules and automations as needed

### Adding More Mock Data

1. Open `scripts/seed_mock_data.js`
2. Add new entries to `SAMPLE_USERS`, `SAMPLE_BUSES`, etc.
3. Create new seeding functions for additional entities
4. Call them in the `seedDatabase()` function

## 🔍 Querying Mock Data

### Find Sample Bookings

```sql
-- Get all confirmed bookings
SELECT * FROM bus_bookings WHERE status = 'confirmed';

-- Get pending bookings about to expire
SELECT * FROM bus_bookings 
WHERE status = 'pending' 
AND "expiresAt" < NOW() + INTERVAL '5 minutes';

-- Get schedules for today
SELECT * FROM bus_schedules 
WHERE departure_date = CURRENT_DATE;
```

### View Email Templates in DB

Email templates are stored in code, not database. Access via:

```javascript
import { EMAIL_TEMPLATES } from './config/emailTemplates.js';
console.log(Object.keys(EMAIL_TEMPLATES));
```

## 📚 Additional Resources

- **API Documentation**: `/docs/API_DOCUMENTATION.md`
- **Database Design**: `/docs/DATABASE_DESIGN.md`
- **Setup Guide**: `/docs/SETUP_GUIDE.md`
- **User Guide**: `/docs/USER_GUIDE.md`

## 🐛 Troubleshooting

### Seeder Fails with "Already Exists"

This is normal - the seeder checks for existing data and skips duplicates. Look for:
```
⏭️  User already exists: admin@busbook.com
```

### Foreign Key Errors

Ensure you run the seeder in order. The script handles dependencies automatically.

### No Schedules Created

Check that buses and routes were created first. The seeder creates them in the correct order.

## 📞 Support

For issues or questions:
- Check existing documentation in `/docs`
- Review test files in `__tests__/`
- Contact: support@busbook.com

---

**Last Updated**: January 2, 2026  
**Version**: 1.0.0
