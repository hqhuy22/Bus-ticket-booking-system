# 🎨 Design Documentation - Bus Ticket Booking System

This directory contains UI mockups, wireframes, and design specifications for the Bus Ticket Booking System.

## 📂 Contents

1. **UI_WIREFRAMES.md** - Complete annotated wireframes for all pages
2. **UI_COMPONENTS.md** - Component library and design system
3. **USER_FLOWS.md** - User journey and interaction flows
4. **DESIGN_SYSTEM.md** - Colors, typography, spacing, and style guide

## 🎯 Design Principles

### 1. **User-Centric Design**
- Simple and intuitive interface
- Clear call-to-action buttons
- Minimal steps to complete booking
- Mobile-first responsive design

### 2. **Visual Hierarchy**
- Important information stands out
- Consistent use of colors and typography
- Clear distinction between primary and secondary actions

### 3. **Accessibility**
- WCAG 2.1 AA compliant
- Proper color contrast ratios
- Keyboard navigation support
- Screen reader friendly

### 4. **Performance**
- Optimized images and assets
- Lazy loading for better performance
- Progressive enhancement

## 🎨 Color Palette

Based on the Tailwind CSS configuration:

### Primary Colors
- **Primary Blue**: `#3B82F6` (Blue-500)
- **Info/Accent**: `#06B6D4` (Cyan-600)
- **Success**: `#10B981` (Green-500)
- **Warning**: `#F59E0B` (Amber-500)
- **Error**: `#EF4444` (Red-500)

### Neutral Colors
- **Gray-50**: `#F9FAFB` (Background)
- **Gray-100**: `#F3F4F6` (Light Background)
- **Gray-600**: `#4B5563` (Secondary Text)
- **Gray-800**: `#1F2937` (Primary Text)
- **Gray-900**: `#111827` (Headings)

### Semantic Colors
- **Text Primary**: Gray-900
- **Text Secondary**: Gray-600
- **Border**: Gray-200
- **Background**: White/Gray-50
- **Hover States**: Darker shades of primary colors

## 📱 Responsive Breakpoints

```css
- Mobile: < 640px (sm)
- Tablet: 640px - 1024px (md/lg)
- Desktop: > 1024px (xl)
```

## 🖼️ Pages Overview

### Public Pages
1. **Home Page** - Hero section with route search
2. **Search Results** - Bus listings with filters
3. **Seat Selection** - Interactive seat map
4. **Booking Payment** - Payment form and confirmation
5. **Guest Booking Lookup** - Find booking without login

### Authenticated Pages
6. **Dashboard** - User bookings and profile
7. **Booking Details** - View booking information
8. **Write Review** - Rate and review trips
9. **Notification Preferences** - Manage email/SMS settings

### Admin Pages
10. **Admin Dashboard** - Analytics and management
11. **Bus Management** - CRUD operations for buses
12. **Schedule Management** - Manage bus schedules
13. **Booking Management** - View and manage bookings

## 🔗 Quick Links

- [Complete Wireframes](./UI_WIREFRAMES.md)
- [Component Library](./UI_COMPONENTS.md)
- [User Flows](./USER_FLOWS.md)
- [Design System](./DESIGN_SYSTEM.md)

## 📝 Notes

All designs are based on the existing implementation found in:
- `/bus-booking-client/src/pages/` - Page implementations
- `/bus-booking-client/src/components/` - Component implementations
- `/bus-booking-client/tailwind.config.js` - Design tokens

These wireframes serve as both documentation of the current UI and guidelines for future enhancements.
