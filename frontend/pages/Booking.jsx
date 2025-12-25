import { useSelector } from 'react-redux';
import Bus from '../components/bus/Bus';
import BusBookingCard from '../components/booking/BusBookingCard';

export default function Booking() {
  const mobileOpen = useSelector(state => state.theme.isMobileOpen);
  return (
    <div
      className={`flex flex-col ${mobileOpen && 'hidden'} min-h-[80vh] sm:px-8 px-2 pt-24 space-y-8`}
    >
      <BusBookingCard />
      <Bus />
    </div>
  );
}
