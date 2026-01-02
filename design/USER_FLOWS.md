# 🔄 User Flows - Bus Ticket Booking System

Complete user journey diagrams and interaction flows.

---

## Table of Contents

1. [Guest User Booking Flow](#guest-user-booking-flow)
2. [Registered User Booking Flow](#registered-user-booking-flow)
3. [Guest Booking Lookup Flow](#guest-booking-lookup-flow)
4. [User Registration & Login Flow](#user-registration--login-flow)
5. [Review & Rating Flow](#review--rating-flow)
6. [Admin Management Flows](#admin-management-flows)

---

## 1. Guest User Booking Flow

### Main Booking Journey (Without Account)

```
START
  ↓
┌─────────────────┐
│  Home Page      │ ← User lands on homepage
└─────────────────┘
  ↓
  User enters search criteria:
  • From: Hanoi
  • To: Ho Chi Minh City
  • Date: Jan 15, 2026
  ↓
  Click [Search Buses]
  ↓
┌─────────────────┐
│ Search Results  │ ← Shows list of available buses
└─────────────────┘
  ↓
  User browses results
  • Can filter by price, time, amenities
  • Can sort by price, departure time
  ↓
  Click [View Details] (Optional)
  ↓
┌─────────────────┐
│ Trip Details    │ ← Modal shows full bus information
│    Modal        │
└─────────────────┘
  ↓
  Click [Book This Bus] or [Book Now]
  ↓
┌─────────────────┐
│ Seat Selection  │ ← Interactive seat map
└─────────────────┘
  ↓
  User selects seats
  • Seats locked for 15 minutes
  • Timer countdown shown
  • Real-time availability updates
  ↓
  Click [Proceed to Payment]
  ↓
┌─────────────────┐
│ Payment Page    │ ← Booking & payment form
└─────────────────┘
  ↓
  User enters:
  • Passenger details (name, email, phone)
  • Payment information
  ↓
  Click [Pay Now]
  ↓
  System processes payment
  ↓
  ┌─ Success ──────────────────┐
  │                             │
  ↓                             ↓ (If payment fails)
┌─────────────────┐      ┌──────────────┐
│ Payment Success │      │ Failed Page  │
│     Page        │      └──────────────┘
└─────────────────┘             ↓
  ↓                      [Try Again]
  • Shows booking confirmation           ↓
  • Booking reference: BK-XXXXX    (Returns to payment)
  • Email sent with ticket PDF
  • SMS notification (optional)
  ↓
  User can:
  • Download ticket PDF
  • View booking details
  • Use booking reference for future lookup
  ↓
END
```

**Key Points:**
- No login required for booking
- Session-based seat locking (15 min)
- Booking reference generated for guest users
- Confirmation sent via email/SMS

---

## 2. Registered User Booking Flow

### Logged-In User Journey

```
START
  ↓
  User already logged in
  ↓
┌─────────────────┐
│  Home/Dashboard │
└─────────────────┘
  ↓
  Click [Search Buses] or use search bar
  ↓
  (Same as Guest Flow: Search → Results → Details)
  ↓
┌─────────────────┐
│ Seat Selection  │
└─────────────────┘
  ↓
  Select seats
  ↓
  Click [Proceed to Payment]
  ↓
┌─────────────────┐
│ Payment Page    │
└─────────────────┘
  ↓
  • Passenger details AUTO-FILLED from profile
  • User can modify if needed
  • Saved payment methods available (optional)
  ↓
  Complete payment
  ↓
┌─────────────────┐
│ Payment Success │
└─────────────────┘
  ↓
  Booking saved to user account
  ↓
┌─────────────────┐
│  Dashboard      │ ← User can view all bookings
└─────────────────┘
  ↓
  User can:
  • View booking history
  • Cancel upcoming bookings
  • Download tickets
  • Write reviews after trip
  ↓
END
```

**Advantages for Registered Users:**
- Auto-filled passenger details
- Booking history saved
- Easy cancellation
- Review and rating capability
- Notification preferences

---

## 3. Guest Booking Lookup Flow

### Finding Booking Without Login

```
START
  ↓
┌─────────────────┐
│  Home Page      │
└─────────────────┘
  ↓
  Click [Find My Booking]
  ↓
┌─────────────────┐
│ Guest Lookup    │
│     Page        │
└─────────────────┘
  ↓
  User enters:
  • Booking Reference: BK-12345
  • Verification: Email OR Phone
  ↓
  Click [Find My Booking]
  ↓
  System validates
  ↓
  ┌─ Valid ────────────────────┐
  │                             │
  ↓                             ↓ (If invalid)
┌─────────────────┐      ┌──────────────┐
│ Guest Booking   │      │ Error Message│
│   Details       │      └──────────────┘
└─────────────────┘             ↓
  ↓                      "Booking not found"
  Shows:                         ↓
  • Booking information    [Try Again]
  • Trip details
  • Passenger details
  • Payment status
  ↓
  User can:
  • Download ticket PDF
  • View booking status
  • Cancel booking (if allowed)
  ↓
END
```

**Security Features:**
- Requires booking reference + email/phone verification
- Time-limited access
- No account modification allowed

---

## 4. User Registration & Login Flow

### Registration Flow

```
START
  ↓
┌─────────────────┐
│  Home Page      │
└─────────────────┘
  ↓
  Click [Sign Up]
  ↓
┌─────────────────┐
│ Registration    │
│     Page        │
└─────────────────┘
  ↓
  User enters:
  • Full Name
  • Email
  • Phone Number
  • Password
  • Confirm Password
  ↓
  OR
  ↓
  Click [Sign up with Google]
  ↓
  ┌─── Google OAuth ───┐
  │                     │
  ↓                     ↓
  Google Account    (Manual Registration)
  Authentication         ↓
  ↓                 Validate form
  ↓                      ↓
  Account Created   Click [Register]
  ↓                      ↓
  └──────────────────────┘
  ↓
┌─────────────────┐
│ Email           │ ← Verification email sent
│ Verification    │
└─────────────────┘
  ↓
  User clicks link in email
  ↓
┌─────────────────┐
│ Email Verified  │ ← Account activated
└─────────────────┘
  ↓
  Auto-login (or redirect to login)
  ↓
┌─────────────────┐
│   Dashboard     │
└─────────────────┘
  ↓
END
```

### Login Flow

```
START
  ↓
┌─────────────────┐
│  Home Page      │
└─────────────────┘
  ↓
  Click [Login]
  ↓
┌─────────────────┐
│  Login Page     │
└─────────────────┘
  ↓
  User enters:
  • Email
  • Password
  ↓
  OR
  ↓
  Click [Login with Google]
  ↓
  ┌─── Options ─────┐
  │                  │
  ↓                  ↓
  Google OAuth   Manual Login
  ↓                  ↓
  └──────────────────┘
  ↓
  Click [Login]
  ↓
  System validates credentials
  ↓
  ┌─ Valid ────────────────────┐
  │                             │
  ↓                             ↓ (If invalid)
┌─────────────────┐      ┌──────────────┐
│   Dashboard     │      │ Error Message│
└─────────────────┘      └──────────────┘
  ↓                             ↓
  Logged in              "Invalid credentials"
  • JWT token stored            ↓
  • User info in Redux    [Try Again] or
  ↓                       [Forgot Password?]
END
```

### Forgot Password Flow

```
START
  ↓
┌─────────────────┐
│  Login Page     │
└─────────────────┘
  ↓
  Click [Forgot Password?]
  ↓
┌─────────────────┐
│ Forgot Password │
│      Page       │
└─────────────────┘
  ↓
  User enters email
  ↓
  Click [Send Reset Link]
  ↓
┌─────────────────┐
│ Email Sent      │ ← Reset link sent
└─────────────────┘
  ↓
  User clicks link in email
  ↓
┌─────────────────┐
│ Reset Password  │
│      Page       │
└─────────────────┘
  ↓
  User enters:
  • New Password
  • Confirm Password
  ↓
  Click [Reset Password]
  ↓
┌─────────────────┐
│ Password Reset  │ ← Success message
│    Success      │
└─────────────────┘
  ↓
  Redirect to login
  ↓
END
```

---

## 5. Review & Rating Flow

### Writing a Review After Trip

```
START
  ↓
  User logged in
  ↓
┌─────────────────┐
│   Dashboard     │
└─────────────────┘
  ↓
  Navigate to [My Reviews] or [Booking History]
  ↓
┌─────────────────┐
│ Booking History │
└─────────────────┘
  ↓
  Find completed trip
  ↓
  Click [Write Review]
  ↓
┌─────────────────┐
│ Write Review    │
│      Page       │
└─────────────────┘
  ↓
  User provides:
  • Rating (1-5 stars)
  • Review Title
  • Review Comment
  • Optional: Upload photos
  ↓
  Click [Submit Review]
  ↓
  System validates
  ↓
┌─────────────────┐
│ Review Submitted│ ← Confirmation
└─────────────────┘
  ↓
  Review visible to:
  • Other users (on bus listings)
  • Admin (for moderation)
  • User's profile
  ↓
END
```

### Browsing Reviews

```
START
  ↓
┌─────────────────┐
│ Search Results  │
└─────────────────┘
  ↓
  Click [View Details] on bus card
  ↓
┌─────────────────┐
│ Trip Details    │
│    Modal        │
└─────────────────┘
  ↓
  Shows:
  • Average rating (e.g., 4.5/5)
  • Total reviews count
  • Recent reviews
  ↓
  Click [View All Reviews]
  ↓
┌─────────────────┐
│ Browse Reviews  │
│      Page       │
└─────────────────┘
  ↓
  User can:
  • Filter by rating (5★, 4★, etc.)
  • Sort by newest/oldest/highest rated
  • Read full reviews
  ↓
END
```

---

## 6. Admin Management Flows

### Bus Management Flow

```
START (Admin logged in)
  ↓
┌─────────────────┐
│ Admin Dashboard │
└─────────────────┘
  ↓
  Click [Buses] in sidebar
  ↓
┌─────────────────┐
│ Bus Management  │
└─────────────────┘
  ↓
  Click [Add New Bus]
  ↓
┌─────────────────┐
│  Add Bus Form   │
└─────────────────┘
  ↓
  Admin enters:
  • Bus Number
  • Bus Type (AC/Non-AC, Seater/Sleeper)
  • Capacity
  • Amenities
  • Upload bus image
  ↓
  Click [Save]
  ↓
  Bus added to system
  ↓
┌─────────────────┐
│  Bus List       │ ← Updated list
└─────────────────┘
  ↓
  Admin can:
  • Edit existing buses
  • Delete buses
  • View bus details
  • Assign buses to routes
  ↓
END
```

### Schedule Management Flow

```
START (Admin logged in)
  ↓
┌─────────────────┐
│ Admin Dashboard │
└─────────────────┘
  ↓
  Click [Schedules] in sidebar
  ↓
┌─────────────────┐
│  Schedule       │
│  Management     │
└─────────────────┘
  ↓
  Click [Create Schedule]
  ↓
┌─────────────────┐
│ Create Schedule │
│      Form       │
└─────────────────┘
  ↓
  Admin enters:
  • Route (From → To)
  • Bus (from bus list)
  • Departure Date & Time
  • Arrival Date & Time
  • Price
  • Available Seats
  ↓
  Click [Create]
  ↓
  Schedule created
  ↓
  Schedule appears in:
  • Admin schedule list
  • Public search results
  ↓
  Admin can:
  • Edit schedules
  • Cancel schedules
  • View bookings for schedule
  ↓
END
```

### Booking Management Flow

```
START (Admin logged in)
  ↓
┌─────────────────┐
│ Admin Dashboard │
└─────────────────┘
  ↓
  Click [Bookings] in sidebar
  ↓
┌─────────────────┐
│  Booking        │
│  Management     │
└─────────────────┘
  ↓
  Shows table of all bookings
  • Filter by status, date, route
  • Search by booking ID or customer
  ↓
  Click on booking row
  ↓
┌─────────────────┐
│ Booking Details │
└─────────────────┘
  ↓
  Admin can:
  • View full booking information
  • Change booking status
  • Cancel booking (with refund)
  • Contact customer
  • Download ticket PDF
  • View payment details
  ↓
END
```

---

## Flow Decision Points

### Decision: Guest vs Registered User

```
User arrives at site
  ↓
  Has account?
  ├─ YES → Login → Full features
  │         • Save bookings
  │         • Auto-fill details
  │         • Manage preferences
  │         • Write reviews
  │
  └─ NO  → Guest Booking
            • Quick booking
            • Email confirmation
            • Lookup later with reference
            • Option to create account after
```

### Decision: Seat Selection Timeout

```
User on Seat Selection page
  ↓
  Seats selected and locked
  ↓
  15-minute timer starts
  ↓
  User actions?
  ├─ Completes payment in time
  │  → Booking confirmed
  │  → Seats permanently booked
  │
  ├─ Abandons page/closes browser
  │  → Locks released after 15 min
  │  → Seats available again
  │
  └─ Timer expires while on page
     → Show warning
     → Release locks
     → Prompt to re-select seats
```

### Decision: Payment Result

```
User clicks [Pay Now]
  ↓
  Payment gateway processes
  ↓
  Result?
  ├─ SUCCESS
  │  → Booking confirmed
  │  → Email/SMS sent
  │  → Redirect to success page
  │  → Generate ticket PDF
  │
  ├─ FAILED
  │  → Seats remain locked (timer continues)
  │  → Show error message
  │  → Option to retry
  │  → Suggest alternative payment method
  │
  └─ PENDING (rare)
     → Show pending status
     → Keep seats locked
     → Send update email when resolved
```

---

## Mobile App Flow Differences

### Mobile-Specific Interactions

```
1. Navigation:
   • Hamburger menu instead of top nav
   • Bottom tab bar for main sections
   • Swipe gestures for seat selection

2. Forms:
   • One field per screen (stepped)
   • Native date/time pickers
   • Auto-complete from device contacts

3. Notifications:
   • Push notifications for booking updates
   • SMS for booking confirmations
   • In-app notifications for offers

4. Payments:
   • Mobile wallet integration
   • QR code scanning
   • Biometric authentication
```

---

## Accessibility Considerations

### Screen Reader Flow

```
User with screen reader
  ↓
  All interactive elements have ARIA labels
  ↓
  Form fields announce:
  • Label
  • Current value
  • Error state (if any)
  • Required status
  ↓
  Seat selection announces:
  • Seat number
  • Seat status (available/booked/selected)
  • Price
  ↓
  Navigation is logical (tab order)
```

### Keyboard Navigation Flow

```
User using only keyboard
  ↓
  Tab key moves focus through:
  1. Skip to main content link
  2. Logo (focusable)
  3. Navigation links
  4. Form fields (in order)
  5. Buttons
  6. Footer links
  ↓
  Enter key activates:
  • Links
  • Buttons
  • Submit forms
  ↓
  Escape key closes:
  • Modals
  • Dropdowns
  • Menus
```

---

## Conclusion

These user flows represent the complete journey through the Bus Ticket Booking System. Key takeaways:

1. **Flexible booking** - Works for both guests and registered users
2. **Clear paths** - Minimal steps from search to confirmation
3. **Safety nets** - Timeouts, validations, and error handling
4. **Multiple entry points** - Home, direct search, booking lookup
5. **Admin control** - Full management capabilities

All flows are designed with user experience, security, and efficiency in mind.
