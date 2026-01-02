# 🧩 UI Components Library - Bus Ticket Booking System

Component-based design system and reusable UI elements.

---

## Table of Contents

1. [Buttons](#buttons)
2. [Input Fields](#input-fields)
3. [Cards](#cards)
4. [Navigation](#navigation)
5. [Modals & Dialogs](#modals--dialogs)
6. [Icons & Images](#icons--images)
7. [Forms](#forms)
8. [Data Display](#data-display)

---

## Buttons

### Primary Button
```
┌────────────────────┐
│   Search Buses     │ ← Blue background (#3B82F6)
└────────────────────┘   White text, rounded corners
```
**Usage**: Main actions (Search, Book Now, Pay Now)
**States**: Default, Hover (darker blue), Active, Disabled

### Secondary Button
```
┌────────────────────┐
│   View Details     │ ← White background, blue border
└────────────────────┘   Blue text
```
**Usage**: Secondary actions (View, Modify, Cancel)

### Danger Button
```
┌────────────────────┐
│   Cancel Booking   │ ← Red background (#EF4444)
└────────────────────┘   White text
```
**Usage**: Destructive actions (Cancel, Delete)

### Icon Button
```
┌───┐
│ × │ ← Small, icon-only button
└───┘
```
**Usage**: Close modals, Remove items

### Button Sizes
- **Small**: `px-3 py-1.5 text-sm`
- **Medium**: `px-4 py-2 text-base` (default)
- **Large**: `px-6 py-3 text-lg`

---

## Input Fields

### Text Input
```
┌─────────────────────────────────┐
│ Full Name                       │
│ [John Doe_________________]     │ ← Border on focus (blue)
└─────────────────────────────────┘
```
**Props**: label, placeholder, value, onChange, error

### Dropdown/Select
```
┌─────────────────────────────────┐
│ Select City                     │
│ [Hanoi                      ▼]  │
└─────────────────────────────────┘
```
**Props**: label, options, value, onChange

### Autocomplete Input
```
┌─────────────────────────────────┐
│ From City                       │
│ [Ha_________________________]   │
│ ┌─────────────────────────────┐ │
│ │ 🔍 Hanoi                    │ │ ← Dropdown suggestions
│ │   Ha Giang                  │ │
│ │   Hai Phong                 │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```
**Props**: label, suggestions, onSelect

### Date Picker
```
┌─────────────────────────────────┐
│ Departure Date                  │
│ [📅 01/15/2026_______________]  │ ← Calendar icon
└─────────────────────────────────┘
```
**Props**: label, value, minDate, onChange

### Checkbox
```
☐ WiFi Available    ← Unchecked
☑ AC Bus            ← Checked
```
**Props**: label, checked, onChange

### Radio Button
```
◯ Email             ← Unselected
⦿ Phone Number      ← Selected
```
**Props**: name, value, label, checked, onChange

---

## Cards

### Bus Booking Card
```
┌────────────────────────────────────────────┐
│ Route #87          Hanoi                   │ ← Header (cyan bg)
├────────────────────────────────────────────┤
│ ┌──────────┐                               │
│ │   🚌     │  Departure: Hanoi              │
│ │  Image   │  Date: Jan 15, 2026            │
│ │          │  Time: 16:00                   │
│ └──────────┘                               │
│              Arrival: Ho Chi Minh City     │
│              Date: Jan 16, 2026            │
│              Time: 02:00                   │
│                                            │
│ Duration: 10h | Seats: 28/40               │
│ WiFi • AC • Snacks                         │
│                                            │
│ Price: 450,000 VND                         │
│ [View Details]  [Book Now]                 │
└────────────────────────────────────────────┘
```
**Components**: Image, TextCard, Button
**Props**: schedule (object with route, time, price data)

### Info Card (Dashboard Stats)
```
┌─────────────┐
│  📊         │
│  Total      │
│  Bookings   │
│             │
│    12       │ ← Large number
└─────────────┘
```
**Props**: icon, title, value, color

### Booking Card (User Dashboard)
```
┌────────────────────────────────────────────┐
│ Booking #BK-12345       [✅ Confirmed]     │
│                                            │
│ 📍 Hanoi → Ho Chi Minh City                │
│ 📅 Jan 15, 2026  ⏰ 16:00                  │
│ 💺 Seats: A5, B12                          │
│ 💰 950,000 VND                             │
│                                            │
│ [View Details] [Cancel] [Download PDF]     │
└────────────────────────────────────────────┘
```
**Props**: booking (object), onView, onCancel, onDownload

---

## Navigation

### Top Header (Desktop)
```
┌──────────────────────────────────────────────────────────┐
│  [qTechy Logo]    [Home] [About] [Contact]  [Login] [👤] │
└──────────────────────────────────────────────────────────┘
```
**Components**: Logo, NavLinks, AuthButtons, ProfileDropdown

### Mobile Header
```
┌──────────────────────────────────┐
│ ☰    [qTechy Logo]          [👤] │
└──────────────────────────────────┘
```
**Components**: HamburgerMenu, Logo, ProfileIcon

### Side Navigation (Dashboard)
```
┌─────────────────┐
│  [User Avatar]  │
│  John Doe       │
│  ─────────────  │
│  📊 Dashboard   │ ← Active (blue background)
│  🎫 Bookings    │
│  👤 Profile     │
│  🔔 Notify      │
│  ⭐ Reviews     │
│  🚪 Logout      │
└─────────────────┘
```
**Props**: activeTab, user, onNavigate

### Breadcrumbs
```
Home > Search Results > Seat Selection > Payment
  ↑         ↑               ↑ Current       (Gray)
```

---

## Modals & Dialogs

### Trip Details Modal
```
┌─────────────────────────────────────────────┐
│  Trip Details                          [×]  │
├─────────────────────────────────────────────┤
│                                             │
│  Route #87: Hanoi → Ho Chi Minh City        │
│                                             │
│  🚌 Bus Information:                        │
│  • Type: Sleeper AC                         │
│  • Operator: qTechy Express                 │
│  • Rating: ⭐⭐⭐⭐ (4.5/5)                   │
│                                             │
│  📅 Schedule Details:                       │
│  • Departure: Jan 15, 2026 at 16:00         │
│  • Arrival: Jan 16, 2026 at 02:00           │
│  • Duration: 10 hours                       │
│                                             │
│  ✨ Amenities:                              │
│  WiFi • AC • Snacks • TV • Blankets         │
│                                             │
│  💺 Available Seats: 28/40                  │
│  💰 Price: 450,000 VND per seat             │
│                                             │
│                    [Close] [Book This Bus]  │
└─────────────────────────────────────────────┘
```
**Props**: schedule, onClose, onBook

### Confirmation Dialog
```
┌─────────────────────────────────┐
│  ⚠️ Confirm Cancellation        │
├─────────────────────────────────┤
│                                 │
│  Are you sure you want to       │
│  cancel this booking?           │
│                                 │
│  This action cannot be undone.  │
│                                 │
│       [No]  [Yes, Cancel]       │
└─────────────────────────────────┘
```
**Props**: message, onConfirm, onCancel

### Toast Notification
```
┌────────────────────────────────┐
│ ✅ Booking confirmed!     [×]  │ ← Appears top-right
└────────────────────────────────┘
   Auto-dismiss after 3 seconds
```
**Types**: success (green), error (red), info (blue), warning (yellow)

---

## Icons & Images

### Icon Set (lucide-react)
- 📅 `Calendar` - Dates
- ⏰ `Clock` - Time
- 📍 `MapPin` - Location
- 🚌 `Bus` - Bus/Transport
- 💺 `Armchair` - Seats
- 💰 `DollarSign` - Price/Payment
- ✅ `Check` - Confirmed/Success
- ❌ `X` - Cancel/Close/Error
- 🔍 `Search` - Search functionality
- 🔔 `Bell` - Notifications
- ⭐ `Star` - Reviews/Rating
- 👤 `User` - Profile/Account
- ⚙️ `Settings` - Settings/Configuration

### Bus Images
- Default placeholder when no image available
- Aspect ratio: 16:9 or 4:3
- Rounded corners: 8px
- Lazy loading enabled

### Logos
- **Primary Logo**: Full color (blue/cyan)
- **Secondary Logo**: Monochrome (white for dark backgrounds)
- Sizes: Small (32px), Medium (48px), Large (64px)

---

## Forms

### Search Form (Home Page)
```
┌──────────────────────────────────┐
│  FROM: [Hanoi ▼]                 │
│          [🔄 Swap]                │
│  TO:   [Ho Chi Minh City ▼]      │
│  DATE: [📅 01/15/2026]           │
│                                  │
│     [🔍 Search Buses]            │
└──────────────────────────────────┘
```
**Fields**: from, to, date
**Validation**: All fields required, date >= today

### Booking Form
```
┌──────────────────────────────────┐
│  PASSENGER DETAILS               │
│                                  │
│  Full Name: [_________________]  │
│  Email:     [_________________]  │
│  Phone:     [_________________]  │
│  Age:       [__] Gender: [▼]    │
│                                  │
│  [← Back]      [Continue →]     │
└──────────────────────────────────┘
```
**Validation**: Name, email format, phone format

### Payment Form
```
┌──────────────────────────────────┐
│  PAYMENT METHOD                  │
│  ◯ PayOS                         │
│  ◯ Credit/Debit Card             │
│                                  │
│  Card Number: [________________] │
│  Expiry: [MM/YY]  CVV: [___]    │
│  Name: [_______________________] │
│                                  │
│  ☑ I agree to terms              │
│                                  │
│  [Pay Now 950,000 VND →]        │
└──────────────────────────────────┘
```
**Validation**: Card number (16 digits), expiry (future date), CVV (3-4 digits)

---

## Data Display

### Seat Map
```
    DRIVER [🚗]
    ═══════════

    UPPER DECK
    ┌─┬─┬─┬─┐
    │✅│❌│✅│✅│ Row 1
    ├─┼─┼─┼─┤
    │⭐│✅│🔒│✅│ Row 2
    ├─┼─┼─┼─┤
    │✅│✅│✅│❌│ Row 3
    └─┴─┴─┴─┘

    LOWER DECK
    ┌─┬─┬─┬─┐
    │✅│⭐│✅│✅│ Row 1
    ├─┼─┼─┼─┤
    │✅│✅│✅│✅│ Row 2
    └─┴─┴─┴─┘
```
**Legend**:
- ✅ Available (green, clickable)
- ❌ Booked (red, disabled)
- 🔒 Locked (gray, disabled)
- ⭐ Selected (blue, clickable to deselect)

### Data Table (Admin)
```
┌──────┬────────┬────────┬───────────┬──────────┐
│ ID   │ Route  │ Date   │ Customer  │ Status   │
├──────┼────────┼────────┼───────────┼──────────┤
│ #123 │ HN-HCM │ 01/15  │ John Doe  │ ✅ Conf  │
│ #124 │ HCM-DN │ 01/16  │ Jane S.   │ 🟡 Pend  │
│ #125 │ DN-HN  │ 01/17  │ Bob K.    │ ❌ Canc  │
└──────┴────────┴────────┴───────────┴──────────┘
[← Previous]  Page 1 of 10  [Next →]
```
**Features**: Sortable columns, pagination, row actions

### Statistics Cards
```
┌────────────────┐  ┌────────────────┐
│ 📊 Revenue     │  │ 👥 Users       │
│                │  │                │
│ 12.5M VND      │  │ 1,234          │
│ +15% this week │  │ +23 new today  │
└────────────────┘  └────────────────┘
```

### Progress Bar
```
Booking Progress:
[████████░░░░░░░░] 60%
Search → Seats → Payment → Confirm
```

### Badge/Status Indicator
```
[✅ Confirmed]  ← Green background
[🟡 Pending]    ← Yellow background
[❌ Cancelled]  ← Red background
[⏰ Expired]    ← Gray background
```

---

## Component Implementation Notes

### Technology Stack
- **React**: Component library
- **Tailwind CSS**: Styling
- **lucide-react**: Icons
- **React Router**: Navigation
- **Redux Toolkit**: State management

### Common Props Pattern
```jsx
// Example Button Component
<Button
  variant="primary" // primary, secondary, danger
  size="medium"     // small, medium, large
  disabled={false}
  onClick={handleClick}
  className="additional-classes"
>
  Button Text
</Button>
```

### Responsive Design
- **Mobile-first approach**: Base styles for mobile, override for larger screens
- **Breakpoints**: sm (640px), md (768px), lg (1024px), xl (1280px)
- **Flexbox/Grid**: Layout containers

### Accessibility
- **ARIA labels**: For screen readers
- **Keyboard navigation**: Tab index and focus states
- **Color contrast**: WCAG AA compliant
- **Focus indicators**: Visible outline on focus

---

## Usage Examples

### Creating a Bus Card
```jsx
<BusBookingCard
  schedule={{
    id: 1,
    routeNo: 87,
    departure_city: "Hanoi",
    arrival_city: "Ho Chi Minh City",
    departure_date: "2026-01-15",
    departure_time: "16:00",
    arrival_date: "2026-01-16",
    arrival_time: "02:00",
    duration: "10:00",
    price: 450000,
    availableSeats: 28
  }}
  onViewDetails={() => {}}
/>
```

### Creating a Form Input
```jsx
<TextInput
  label="Full Name"
  placeholder="Enter your full name"
  value={name}
  onChange={(e) => setName(e.target.value)}
  error={errors.name}
  required
/>
```

### Creating a Modal
```jsx
<Modal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  title="Trip Details"
>
  <TripDetailsContent schedule={selectedSchedule} />
</Modal>
```

---

## Conclusion

This component library provides a consistent, reusable set of UI elements for the Bus Ticket Booking System. All components follow:

- **Consistent styling** with Tailwind CSS
- **Accessibility best practices**
- **Responsive design patterns**
- **Clear prop interfaces**
- **Reusability across pages**

Refer to `/bus-booking-client/src/components/` for actual implementations.
