import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import BusSchedule from '../components/admin/BusSchedule';
import AdminBuses from '../components/admin/AdminBuses';
import AdminRoutes from '../components/admin/AdminRoutes';
import AdminBookings from '../components/admin/AdminBookings';
import RevenueAnalyticsEnhanced from '../components/admin/RevenueAnalyticsEnhanced';
import AdminOverview from '../components/admin/AdminOverview';
import AdminProfile from '../components/admin/AdminProfile';
import TripOperations from '../components/admin/TripOperations';
import {
  Bus,
  Route,
  Calendar,
  LogOut,
  User,
  Ticket,
  TrendingUp,
  LayoutDashboard,
  Settings,
  Clipboard,
} from 'lucide-react';
import { authActions } from '../redux/auth-slice';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleLogout = () => {
    dispatch(authActions.logout());
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/bus-booking/login');
  };

  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      icon: LayoutDashboard,
      component: AdminOverview,
    },
    {
      id: 'schedules',
      label: 'Bus Schedules',
      icon: Calendar,
      component: BusSchedule,
    },
    {
      id: 'operations',
      label: 'Trip Operations',
      icon: Clipboard,
      component: TripOperations,
    },
    { id: 'buses', label: 'Buses', icon: Bus, component: AdminBuses },
    { id: 'routes', label: 'Routes', icon: Route, component: AdminRoutes },
    {
      id: 'bookings',
      label: 'Bookings',
      icon: Ticket,
      component: AdminBookings,
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: TrendingUp,
      component: RevenueAnalyticsEnhanced,
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: Settings,
      component: AdminProfile,
    },
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <nav className="bg-white shadow-md fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-gray-900">
                qTechy Bus Admin
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/bus-booking/dashboard')}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <User size={18} />
                <span className="hidden sm:inline">User Dashboard</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-error-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut size={18} />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="pt-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Admin Dashboard
          </h2>
          <p className="text-gray-600">Manage your bus booking system</p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors
                      ${
                        activeTab === tab.id
                          ? 'border-info-500 text-info-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }
                    `}
                  >
                    <Icon size={20} />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Active Tab Content */}
        <div className="bg-white rounded-lg shadow">
          {ActiveComponent && <ActiveComponent />}
        </div>
      </div>
    </div>
  );
}
