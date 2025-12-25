import HeroSectionDefault from '../components/home/HeroSectionDefault';
import RouteSearchBar from '../components/home/RouteSearchBar';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const mobileOpen = useSelector(state => state.theme.isMobileOpen);
  const navigate = useNavigate();

  return (
    <div className={`flex flex-col ${mobileOpen && 'hidden'} pt-16`}>
      <HeroSectionDefault />

      {/* Guest booking lookup CTA */}
      <div className="max-w-4xl mx-auto -mt-24 mb-12 px-4">
        <div className="bg-white rounded-lg shadow-md p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-800">
              Find your booking
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Lookup your ticket using your booking reference and email or phone
              — no account required.
            </p>
          </div>
          <div>
            <button
              onClick={() => navigate('/bus-booking/guest-lookup')}
              className="px-6 py-3 bg-info-600 text-white rounded-lg hover:bg-info-700 font-semibold"
            >
              Find My Booking
            </button>
          </div>
        </div>
      </div>

      {/* Route Search Section */}
      <div className="max-w-6xl mx-auto mb-20 px-4">
        <RouteSearchBar />
      </div>
    </div>
  );
}
