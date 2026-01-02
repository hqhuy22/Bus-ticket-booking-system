# 📖 User Guide - Bus Ticket Booking System

Complete guide for end-users of the Bus Ticket Booking System.

## Table of Contents

- [Getting Started](#getting-started)
- [Account Management](#account-management)
- [Searching for Buses](#searching-for-buses)
- [Booking Tickets](#booking-tickets)
- [Payment Process](#payment-process)
- [Managing Bookings](#managing-bookings)
- [Guest Booking](#guest-booking)
- [Reviews and Ratings](#reviews-and-ratings)
- [AI Chatbot Assistant](#ai-chatbot-assistant)
- [Admin Dashboard](#admin-dashboard)
- [Troubleshooting](#troubleshooting)

## Getting Started

### System Requirements

**Web Browser:**
- Chrome 90+ (Recommended)
- Firefox 88+
- Safari 14+
- Edge 90+

**Internet Connection:**
- Minimum 2 Mbps for smooth experience

**Email:**
- Valid email address for account registration and booking confirmations

### Accessing the System

1. **Open your web browser**
2. **Navigate to:** `http://localhost:5173` (Development) or your production URL
3. **You'll see the homepage** with search options

---

## Account Management

### Creating an Account

#### Option 1: Register with Email

1. Click **"Sign Up"** or **"Register"** button
2. Fill in the registration form:
   - **Email**: Your valid email address
   - **Username**: Choose a unique username
   - **Password**: Minimum 8 characters
   - **Full Name**: Your full name
   - **Phone Number**: Your contact number
3. Click **"Create Account"**
4. **Check your email** for verification link
5. Click the verification link to activate your account
6. You can now **log in**

**Benefits of Registration:**
- ✅ Track all your bookings in one place
- ✅ Faster checkout process
- ✅ Manage profile and preferences
- ✅ Write reviews for completed trips
- ✅ Receive trip reminders

#### Option 2: Sign in with Google

1. Click **"Sign in with Google"** button
2. Select your Google account
3. Grant necessary permissions
4. You'll be automatically logged in
5. Complete your profile if needed

**Note:** Your Google profile information is securely used to create your account.

---

### Logging In

1. Click **"Login"** or **"Sign In"**
2. Enter your **email** and **password**
3. Click **"Login"**
4. You'll be redirected to the homepage or your dashboard

**Forgot Password?**
1. Click **"Forgot Password?"** link
2. Enter your registered email
3. Check your email for reset link
4. Click the link and enter new password
5. Confirm new password
6. You can now login with new password

---

### Managing Your Profile

#### Viewing Profile

1. Click on your **profile icon** or **username** (top-right)
2. Select **"Profile"** or **"My Account"**
3. View your account details

#### Updating Profile

1. Go to **Profile** page
2. Click **"Edit Profile"**
3. Update information:
   - Full Name
   - Phone Number
   - Username (if available)
4. Click **"Save Changes"**

#### Uploading Profile Picture

1. Go to **Profile** page
2. Click on **profile picture** or **"Upload Avatar"**
3. Select an image file (JPG, PNG)
4. Maximum size: 5MB
5. Click **"Upload"**

#### Changing Password

1. Go to **Profile** page
2. Click **"Change Password"**
3. Enter:
   - Current password
   - New password
   - Confirm new password
4. Click **"Update Password"**

---

## Searching for Buses

### Basic Search

1. On the **homepage**, you'll see the search form:

   **Search Fields:**
   - 🚏 **From (Departure City)**: Select origin city
   - 🏁 **To (Arrival City)**: Select destination city
   - 📅 **Date**: Select journey date
   - 👥 **Passengers**: Number of seats needed (optional)

2. Click **"Search Buses"**

3. View **search results** with available buses

### Search Results

Each result shows:
- 🚌 **Bus Type**: Giường nằm (Sleeper), Ghế ngồi (Seating)
- 🕐 **Departure Time**: e.g., 08:00
- 🕐 **Arrival Time**: e.g., 20:00
- ⏱️ **Duration**: e.g., 12:00 hours
- 💰 **Price**: Ticket price in VND
- 💺 **Available Seats**: Number of seats left
- 📍 **Depot**: Departure location
- ⭐ **Rating**: Average customer rating

### Filtering Results

**Filter Options:**
- 🚌 **Bus Type**: Filter by bus type
- 💰 **Price Range**: Set minimum and maximum price
- 🕐 **Departure Time**: Morning, afternoon, evening, night
- ⭐ **Rating**: Minimum rating

**Sorting Options:**
- 💰 **Price**: Low to high / High to low
- 🕐 **Departure Time**: Earliest to latest
- ⏱️ **Duration**: Shortest to longest

### Advanced Search

Use the **AI Chatbot** for natural language search:

**Examples:**
- "Tôi muốn đi từ Sài Gòn đến Đà Nẵng ngày mai"
- "Show me buses from Hanoi to Halong Bay this weekend"
- "Find sleeper buses under 500k VND"

---

## Booking Tickets

### Step-by-Step Booking Process

#### Step 1: Select Bus Schedule

1. **Search for buses** (as described above)
2. **Browse results** and compare options
3. Click **"Book Now"** on your chosen bus

#### Step 2: Select Seats

You'll see an **interactive seat map**:

**Seat Legend:**
- 🟢 **Green**: Available seats
- 🔴 **Red**: Booked seats
- 🟡 **Yellow**: Temporarily locked (by other users)
- 🔵 **Blue**: Your selected seats

**Selecting Seats:**
1. Click on **available seats** (green)
2. Selected seats turn **blue**
3. Click again to **deselect**
4. Select the number of seats you need
5. Click **"Continue"** when done

**Seat Selection Tips:**
- 💡 Seats are **locked for 15 minutes** once you proceed
- 💡 Choose seats close together for groups
- 💡 Front seats: Less bumpy, better view
- 💡 Back seats: More privacy, quieter

#### Step 3: Enter Passenger Details

For **each seat**, provide:
- **Full Name**: Passenger's full name (as on ID)
- **Age**: Passenger's age
- **Gender**: Male/Female/Other
- **ID Number** (optional): National ID or passport number

**Additional Information:**
- **Pickup Point**: Select boarding location
- **Drop-off Point**: Select destination point
- **Contact Email**: For booking confirmation
- **Contact Phone**: For updates and reminders

Click **"Proceed to Payment"**

#### Step 4: Review Booking

**Review your booking details:**
- ✓ Route and schedule
- ✓ Selected seats
- ✓ Passenger details
- ✓ Pickup/drop-off points

**Price Breakdown:**
```
Bus Fare:           350,000 VND
Convenience Fee:     10,000 VND
Bank Charges:         2,000 VND
─────────────────────────────
Total Amount:       362,000 VND
```

Click **"Confirm Booking"** to proceed to payment

---

## Payment Process

### Payment Methods

1. **PayOS Gateway** (Default)
   - Credit/Debit Cards
   - Bank Transfer
   - E-wallets

2. **Sandbox Mode** (Development/Testing)
   - Test payment without real money

### Making Payment

1. After confirming booking, you'll be redirected to **payment page**

2. You'll see:
   - **Payment ID**: Unique transaction ID
   - **Amount**: Total amount to pay
   - **QR Code**: For mobile payment
   - **Checkout Link**: Payment gateway

3. **Option A: QR Code Payment**
   - Scan QR code with banking app
   - Confirm payment in app

4. **Option B: Checkout Link**
   - Click **"Proceed to Payment"**
   - You'll be redirected to **PayOS gateway**
   - Select payment method
   - Enter payment details
   - Complete payment

5. **After successful payment:**
   - You'll be redirected back
   - Booking status changes to **"Confirmed"**
   - E-ticket sent to your email

### Payment Confirmation

You'll receive:
- ✅ **Booking confirmation email**
- 📄 **E-ticket PDF** with QR code
- 💰 **Payment receipt**

**E-Ticket Contents:**
- Booking reference number
- QR code for verification
- Passenger details
- Bus details and schedule
- Pickup/drop-off points
- Terms and conditions

---

## Managing Bookings

### Viewing Your Bookings

1. **Login** to your account
2. Click **"My Bookings"** or **"Dashboard"**
3. View all your bookings

**Booking Statuses:**
- 🟡 **Pending**: Awaiting payment (expires in 15 min)
- 🟢 **Confirmed**: Payment completed
- 🔵 **Completed**: Trip finished
- 🔴 **Cancelled**: Booking cancelled
- ⚫ **Expired**: Payment not completed in time

### Viewing Booking Details

1. Click on a **booking** from your list
2. View detailed information:
   - Booking reference
   - Bus schedule details
   - Passenger information
   - Payment details
   - Current status

### Downloading E-Ticket

1. Open **booking details**
2. Click **"Download E-Ticket"** button
3. PDF file will be downloaded
4. Print or save for boarding

### Emailing E-Ticket

1. Open **booking details**
2. Click **"Email E-Ticket"**
3. E-ticket will be sent to your registered email

### Cancelling a Booking

**Before Cancellation:**
- ⚠️ Review cancellation policy
- 💰 Refund depends on cancellation time
- ⏰ Cannot cancel after departure

**Cancellation Steps:**
1. Open **booking details**
2. Click **"Cancel Booking"**
3. Select **reason** for cancellation
4. Confirm cancellation
5. Refund processed (if applicable)

**Refund Policy:**
- 🕐 More than 24 hours before: 90% refund
- 🕐 12-24 hours before: 50% refund
- 🕐 Less than 12 hours: No refund

---

## Guest Booking

**Book without creating an account!**

### Making a Guest Booking

1. **Search for buses** (no login required)
2. **Select bus** and click **"Book Now"**
3. Choose **"Continue as Guest"** option
4. **Select seats**
5. **Enter passenger details** including:
   - Guest name
   - Guest email
   - Guest phone number
6. **Complete payment**
7. **Save booking reference number!**

**Important:**
- ✉️ E-ticket sent to guest email
- 🔢 Keep booking reference safe
- 📧 Use email to look up booking

### Looking Up Guest Booking

1. Click **"Guest Booking"** or **"Track Booking"**
2. Enter:
   - **Booking Reference**: e.g., BKG-ABC123XYZ
   - **Email Address**: Email used for booking
3. Click **"Send Verification"**
4. **Check your email** for verification link
5. Click link to **view booking details**

**Why Email Verification?**
- 🔒 Security: Protects your booking information
- ✅ Verification: Confirms you're the booking owner

---

## Reviews and Ratings

### Writing a Review

**After your trip is completed:**

1. Go to **"My Bookings"**
2. Find the **completed booking**
3. Click **"Write Review"**

**Review Form:**
- ⭐ **Overall Rating**: 1-5 stars
- ⭐ **Service Rating**: Quality of service
- ⭐ **Driver Rating**: Driver professionalism
- ⭐ **Vehicle Rating**: Vehicle condition
- 💬 **Comment**: Share your experience (optional)

4. Click **"Submit Review"**

**Review Guidelines:**
- ✓ Be honest and fair
- ✓ Provide constructive feedback
- ✓ Mention specific details
- ✗ Avoid offensive language
- ✗ Don't share personal information

### Viewing Reviews

1. **Search for buses**
2. Click on a **bus schedule**
3. Scroll to **"Reviews"** section
4. Read reviews from other passengers

**Review Information:**
- ⭐ Rating (1-5 stars)
- 💬 Review text
- 👤 Reviewer name
- 📅 Review date
- 👍 Helpful votes

### Helpful/Not Helpful Votes

Help others by voting on reviews:
1. Read a **review**
2. Click **"Helpful"** or **"Not Helpful"**
3. Your vote is recorded

---

## AI Chatbot Assistant

### Using the Chatbot

**Access the Chatbot:**
1. Look for **chat icon** (usually bottom-right)
2. Click to **open chat window**

**What Can the Chatbot Do?**
- 🔍 **Search buses** using natural language
- ❓ **Answer questions** about bookings
- 💡 **Provide suggestions** for routes
- 🗣️ **Support Vietnamese and English**

### Example Conversations

**Searching Buses:**
```
You: Tôi muốn đi từ Hà Nội đến Sapa ngày 25/12
Bot: Tôi tìm thấy 8 chuyến xe từ Hà Nội đến Sapa 
     vào ngày 25/12. Bạn muốn xem chuyến nào?
     - Chuyến 7:00 sáng - Giường nằm - 250,000 VND
     - Chuyến 9:00 sáng - Giường nằm - 270,000 VND
     ...
```

**General Questions:**
```
You: How do I cancel my booking?
Bot: To cancel a booking:
     1. Go to "My Bookings"
     2. Select the booking to cancel
     3. Click "Cancel Booking"
     4. Confirm cancellation
     
     Refunds depend on cancellation time...
```

**Route Suggestions:**
```
You: Best buses from Ho Chi Minh to Da Lat?
Bot: Here are top-rated buses for HCM to Da Lat:
     1. Luxury Sleeper Bus - 4.8⭐ - 300k VND
     2. Comfort Express - 4.6⭐ - 250k VND
     ...
```

---

## Admin Dashboard

**For administrators only**

### Accessing Admin Panel

1. **Login** with admin credentials
2. You'll see **"Admin Dashboard"** link
3. Click to access admin features

### Admin Features

#### 1. Dashboard Overview

View key metrics:
- 💰 **Total Revenue**
- 🎫 **Total Bookings**
- 👥 **Total Customers**
- 🚌 **Active Schedules**
- 📈 **Growth Trends**

#### 2. Manage Buses

**View All Buses:**
- List of all buses in fleet
- Filter by type, status
- Search by bus number

**Add New Bus:**
1. Click **"Add Bus"**
2. Enter details:
   - Bus number
   - Bus type
   - Model
   - Total seats
   - Amenities
3. Upload photos
4. Save

**Edit/Delete Bus:**
- Click on a bus
- Update information
- Toggle active/inactive status
- Delete if not in use

#### 3. Manage Routes

**View Routes:**
- All available routes
- Origin and destination
- Base prices
- Status

**Add New Route:**
1. Click **"Add Route"**
2. Enter route details
3. Add intermediate stops
4. Set base price
5. Save

#### 4. Manage Schedules

**View Schedules:**
- All bus schedules
- Filter by date, route, status
- View passenger count

**Create Schedule:**
1. Click **"Create Schedule"**
2. Select bus and route
3. Set departure/arrival times
4. Set price
5. Publish

**Update Schedule:**
- Edit schedule details
- Mark as completed
- Cancel schedule (with reason)
- View passenger list

#### 5. Manage Bookings

**View All Bookings:**
- All customer bookings
- Filter by status, date
- Search by reference

**Booking Actions:**
- Confirm pending bookings
- Cancel bookings (refund)
- View passenger details
- Download passenger list

#### 6. Customer Management

**View Customers:**
- All registered users
- Guest bookings
- Customer statistics

**Customer Actions:**
- View customer details
- View booking history
- Manage permissions

#### 7. Analytics & Reports

**Revenue Analytics:**
- Daily/weekly/monthly revenue
- Revenue by route
- Payment method breakdown
- Revenue trends

**Booking Analytics:**
- Booking counts
- Cancellation rates
- Popular routes
- Peak booking times

**Financial Reports:**
- Generate reports for date range
- Export to CSV/PDF
- Tax reports
- Profit/loss statements

#### 8. Trip Management

**Passenger Check-in:**
1. Select schedule
2. View passenger list
3. Check-in passengers using:
   - QR code scan
   - Manual search
   - Booking reference

**Update Trip Status:**
- Mark trip as "In Progress"
- Update location/status
- Mark trip as "Completed"

---

## Troubleshooting

### Common Issues

#### 1. Cannot Login

**Problem:** "Invalid email or password"
**Solutions:**
- ✓ Check email spelling
- ✓ Verify password (case-sensitive)
- ✓ Use "Forgot Password" to reset
- ✓ Try signing in with Google if linked

#### 2. Email Not Received

**Problem:** Verification or booking email not received
**Solutions:**
- ✓ Check spam/junk folder
- ✓ Wait a few minutes (can take up to 5 min)
- ✓ Verify email address is correct
- ✓ Request resend verification email
- ✓ Contact support if issue persists

#### 3. Seats Not Available

**Problem:** Selected seats become unavailable
**Reasons:**
- Someone else booked faster
- Seats were locked by another user
- Technical sync delay

**Solutions:**
- ✓ Refresh seat map
- ✓ Select different seats
- ✓ Try again in 15 minutes (lock expires)

#### 4. Payment Failed

**Problem:** Payment unsuccessful
**Solutions:**
- ✓ Check card details
- ✓ Ensure sufficient balance
- ✓ Check if bank requires OTP/2FA
- ✓ Try different payment method
- ✓ Contact your bank
- ✓ Try again after few minutes

#### 5. Booking Expired

**Problem:** Booking shows "Expired" status
**Reason:** Payment not completed within 15 minutes

**Solutions:**
- ✓ Create a new booking
- ✓ Seats will be released automatically
- ✓ Book faster next time

#### 6. Cannot Cancel Booking

**Problem:** Cancel button disabled
**Reasons:**
- Trip already started
- Too close to departure time
- Booking already cancelled

**Solutions:**
- ✓ Check cancellation policy
- ✓ Contact support for assistance
- ✓ Review booking status

#### 7. E-Ticket Not Downloading

**Problem:** PDF download fails
**Solutions:**
- ✓ Check browser pop-up blocker
- ✓ Try different browser
- ✓ Use "Email E-Ticket" option
- ✓ Clear browser cache
- ✓ Check internet connection

#### 8. Chatbot Not Responding

**Problem:** AI chatbot gives errors
**Solutions:**
- ✓ Refresh the page
- ✓ Clear chat history
- ✓ Try simpler questions
- ✓ Check internet connection
- ✓ Use manual search as alternative

### Getting Help

**Support Channels:**

📧 **Email Support:**
- support@busticketbooking.com
- Response within 24 hours

📞 **Phone Support:**
- Hotline: 1900-xxxx
- Available: 8:00 AM - 10:00 PM

💬 **Live Chat:**
- Use chatbot for instant help
- Click "Talk to Human" for agent

❓ **FAQ Page:**
- Common questions answered
- Self-service guides

---

## Tips for Best Experience

### Before Your Trip

- ✅ **Book Early**: Popular routes fill up fast
- ✅ **Verify Details**: Double-check date, time, and route
- ✅ **Save E-Ticket**: Download and save PDF
- ✅ **Set Reminder**: Add to calendar
- ✅ **Check Email**: Watch for trip reminders
- ✅ **Charge Phone**: You may need QR code

### On Travel Day

- ✅ **Arrive Early**: At least 30 minutes before
- ✅ **Bring E-Ticket**: Print or digital copy
- ✅ **Bring ID**: As registered in booking
- ✅ **Check Updates**: Email for any changes
- ✅ **Contact Info**: Keep phone accessible

### After Your Trip

- ✅ **Write Review**: Help other travelers
- ✅ **Check for Refunds**: If any issues
- ✅ **Keep E-Ticket**: For records

---

## Safety and Security

### Personal Information

- 🔒 Your data is encrypted and secure
- 🔒 We never share your information
- 🔒 Payment details are not stored
- 🔒 Use strong passwords

### Booking Safety

- ✓ Always verify booking reference
- ✓ Keep confirmation emails
- ✓ Don't share booking details with strangers
- ✓ Report suspicious activities

### Payment Security

- ✓ Only pay through official gateway
- ✓ Never share CVV/OTP with anyone
- ✓ Verify payment page is secure (HTTPS)
- ✓ Review charges before confirming

---

**Need more help?** Contact our support team or check the FAQ section.

**Last Updated:** January 2, 2026
