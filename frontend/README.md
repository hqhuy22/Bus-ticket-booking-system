# Bus Ticket Booking - Frontend

A modern React + TypeScript + Vite frontend for the bus ticket booking system.

## Features

- ✅ Login & Signup with backend integration
- ✅ Search trips with filters
- ✅ Interactive seat selection
- ✅ Booking management
- ✅ Responsive design
- ✅ Type-safe with TypeScript

## Setup

### Install dependencies

```bash
cd frontend
npm install
```

### Environment variables

Create a `.env.local` file:

```
VITE_API_URL=http://localhost:5000/api
```

### Development server

```bash
npm run dev
```

The app will open at `http://localhost:3000`

### Build for production

```bash
npm run build
```

## Project Structure

```
frontend/
├── src/
│   ├── components/        # React components
│   ├── pages/            # Page components
│   ├── lib/              # API clients & utilities
│   ├── store/            # Zustand stores (auth)
│   ├── styles/           # CSS files
│   ├── App.tsx           # Main app component
│   └── main.tsx          # Entry point
├── package.json
├── vite.config.ts
└── tsconfig.json
```

## Pages

- **Login** (`/login`) - User login with email/password
- **Signup** (`/signup`) - User registration
- **Home** (`/home`) - Dashboard with featured services
- **Search** (`/search`) - Search and filter trips
- **My Bookings** (`/my-bookings`) - View booking history
- **Booking Detail** (`/booking/:id`) - Seat selection and confirmation

## Technologies

- React 18
- TypeScript
- Vite
- React Router v6
- Zustand (state management)
- Axios (HTTP client)
- CSS3 (responsive design)
