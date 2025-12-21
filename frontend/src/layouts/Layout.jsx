import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import {
  Home,
  Navbar,
  Dashboard,
  Login,
  SearchBuses,
  Register,
  BookingProceed,
  BookingPayment,
  Failed,
} from '../utils/index.js';
import Footer from '../components/footer/Footer.jsx';
import ScrollToTop from '../utils/ScrollToTop.js';
import ChatWidget from '../components/chatbot/ChatWidget';
import VerifyEmail from '../pages/VerifyEmail.jsx';
import ForgotPassword from '../pages/ForgotPassword.jsx';
import ResetPassword from '../pages/ResetPassword.jsx';
import ProtectedRoute from '../components/ProtectedRoute.jsx';
import AdminDashboard from '../pages/AdminDashboard.jsx';
import SeatSelection from '../pages/SeatSelection.jsx';
import BookingProceedUpdated from '../pages/BookingProceedUpdated.jsx';
import BookingHistory from '../components/booking/BookingHistory.jsx';
import BookingDetailsPage from '../pages/BookingDetailsPage.jsx';
import GuestBookingLookup from '../pages/GuestBookingLookup.jsx';
import GuestBookingDetails from '../pages/GuestBookingDetails.jsx';
import GuestVerify from '../pages/GuestVerify.jsx';
import PaymentSuccess from '../pages/PaymentSuccess.jsx';
import NotificationPreferences from '../pages/NotificationPreferences.jsx';
import CustomerProfile from '../components/user/CustomerProfile.jsx';
import MyReviewsPage from '../pages/MyReviewsPage.jsx';
import WriteReviewPage from '../pages/WriteReviewPage.jsx';
import BrowseReviewsPage from '../pages/BrowseReviewsPage.jsx';

export default function Layout() {
  return (
    <Router>
      <ScrollToTop />
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/bus-booking/login" element={<Login />} />
        <Route path="/bus-booking/register" element={<Register />} />
        <Route path="/bus-booking/verify-email" element={<VerifyEmail />} />
        <Route
          path="/bus-booking/forgot-password"
          element={<ForgotPassword />}
        />
        <Route path="/bus-booking/reset-password" element={<ResetPassword />} />
        <Route
          path="/bus-booking/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bus-booking/admin"
          element={
            <ProtectedRoute requireAdmin={true}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="/bus-booking/search-buses" element={<SearchBuses />} />
        <Route path="/bus-booking/seat-selection" element={<SeatSelection />} />

        {/* Guest Booking Routes */}
        <Route
          path="/bus-booking/guest-lookup"
          element={<GuestBookingLookup />}
        />
        <Route path="/bus-booking/guest-verify" element={<GuestVerify />} />
        <Route
          path="/bus-booking/guest-booking-details"
          element={<GuestBookingDetails />}
        />

        {/* Updated Booking Flow Routes */}
        <Route
          path="/bus-booking/booking-process"
          element={
            <ProtectedRoute>
              <BookingProceed />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bus-booking/booking-proceed"
          element={<BookingProceedUpdated />}
        />
        <Route
          path="/bus-booking/bookings"
          element={
            <ProtectedRoute>
              <BookingHistory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bus-booking/booking-details/:id"
          element={
            <ProtectedRoute>
              <BookingDetailsPage />
            </ProtectedRoute>
          }
        />

        {/* Notification Preferences */}
        <Route
          path="/bus-booking/notification-preferences"
          element={
            <ProtectedRoute>
              <NotificationPreferences />
            </ProtectedRoute>
          }
        />

        {/* Customer Profile */}
        <Route
          path="/bus-booking/profile"
          element={
            <ProtectedRoute>
              <CustomerProfile />
            </ProtectedRoute>
          }
        />

        {/* Reviews */}
        <Route
          path="/bus-booking/my-reviews"
          element={
            <ProtectedRoute>
              <MyReviewsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bus-booking/write-review"
          element={
            <ProtectedRoute>
              <WriteReviewPage />
            </ProtectedRoute>
          }
        />

        {/* Public Browse Reviews - No auth required */}
        <Route
          path="/bus-booking/browse-reviews"
          element={<BrowseReviewsPage />}
        />

        <Route path="/bus-booking/payment" element={<BookingPayment />} />
        <Route
          path="/bus-booking/BookingPayment"
          element={<BookingPayment />}
        />
        <Route
          path="/bus-booking/payment-success"
          element={<PaymentSuccess />}
        />
        <Route path="/bus-booking/BookingPayment/Failed" element={<Failed />} />
      </Routes>
      <Footer />
      <ChatWidget />
    </Router>
  );
}
