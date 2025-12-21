import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import axios from '../../utils/axiosConfig';
import { toast } from 'react-toastify';
import { authActions } from '../../redux/auth-slice';
import {
  MdHome,
  MdDashboard,
  MdManageAccounts,
  MdOutlineArrowDropDown,
  MdOutlineArrowDropUp,
  MdFeedback,
  MdNotifications,
} from 'react-icons/md';
import { IoLogOut } from 'react-icons/io5';
import { MessageSquare, Star, User } from 'lucide-react';
// removed unused lucide imports
import { AiFillSchedule } from 'react-icons/ai';
import MobileHeader from './MobileHeader';
import Logo from '../logo/Logo';

export default function SideNavigation() {
  const Theme = useSelector(state => state.theme.lightTheme);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [dropdownPages, setDropdownPages] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const toggleDropdownPages = () => setDropdownPages(!dropdownPages);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      // Call server to clear httpOnly cookie
      await axios.get('/api/auth/logout', { withCredentials: true });
    } catch (err) {
      // ignore server errors, still clear client state
      console.error(
        'Logout request failed',
        err && err.message ? err.message : err
      );
    }

    // Clear client-side auth
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    dispatch(authActions.logout());
    toast.success('Logged out', { position: 'top-right' });
    navigate('/bus-booking/login');
  };

  return (
    <>
      <div
        className="shadow-md fixed top-0 left-0 min-w-full "
        style={{ zIndex: 100 }}
      >
        <MobileHeader onClick={toggleSidebar} />
      </div>
      <aside
        id="default-sidebar"
        className={`fixed top-0 left-0 z-40 w-64 h-screen transition-transform ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } sm:translate-x-0 ${Theme ? 'bg-white border-r border-gray-200' : 'bg-gray-600 border-gray-700'} shadow-md`}
        aria-label="Sidenav"
        style={{ zIndex: 150 }}
      >
        <div className={` px-8 py-4 z-30`}>
          <Logo />
        </div>
        <div className="overflow-y-auto py-5 px-3 h-full z-30">
          <ul className="space-y-4">
            <li>
              <Link
                to="/"
                className={`flex items-center px-2 py-1 text-base font-normal ${Theme ? 'text-gray-900 rounded-lg  hover:bg-gray-100' : 'hover:bg-gray-700 text-white'}   group`}
              >
                <span
                  aria-hidden="true"
                  className={`flex justify-items-center scale-125 ${Theme ? 'text-gray-400 group-hover:text-gray-900 ' : ' group-hover:text-white'}  `}
                >
                  <MdHome />
                </span>
                <span className="ml-3">Home</span>
              </Link>
            </li>
            <li>
              <Link
                to="/"
                className={`flex items-center px-2 py-1 text-base font-normal ${Theme ? 'text-gray-900 rounded-lg  hover:bg-gray-100' : 'hover:bg-gray-700 text-white'}   group`}
              >
                <span
                  aria-hidden="true"
                  className={`flex justify-items-center scale-125 ${Theme ? 'text-gray-400 group-hover:text-gray-900 ' : ' group-hover:text-white'}  `}
                >
                  <MdDashboard />
                </span>
                <span className="ml-3">Dashboard</span>
              </Link>
            </li>
            <li>
              <Link
                to="/bus-booking/notification-preferences"
                className={`flex items-center px-2 py-1 text-base font-normal ${Theme ? 'text-gray-900 rounded-lg  hover:bg-gray-100' : 'hover:bg-gray-700 text-white'}   group`}
              >
                <span
                  aria-hidden="true"
                  className={`flex justify-items-center scale-125 ${Theme ? 'text-gray-400 group-hover:text-gray-900 ' : ' group-hover:text-white'}  `}
                >
                  <MdNotifications />
                </span>
                <span className="ml-3">Notifications</span>
              </Link>
            </li>
            <li>
              <Link
                to="/bus-booking/profile"
                className={`flex items-center px-2 py-1 text-base font-normal ${Theme ? 'text-gray-900 rounded-lg  hover:bg-gray-100' : 'hover:bg-gray-700 text-white'}   group`}
              >
                <span
                  aria-hidden="true"
                  className={`flex justify-items-center scale-125 ${Theme ? 'text-gray-400 group-hover:text-gray-900 ' : ' group-hover:text-white'}  `}
                >
                  <User size={16} />
                </span>
                <span className="ml-3">My Profile</span>
              </Link>
            </li>
            <li>
              <Link
                to="/bus-booking/my-reviews"
                className={`flex items-center px-2 py-1 text-base font-normal ${Theme ? 'text-gray-900 rounded-lg  hover:bg-gray-100' : 'hover:bg-gray-700 text-white'}   group`}
              >
                <span
                  aria-hidden="true"
                  className={`flex justify-items-center scale-125 ${Theme ? 'text-gray-400 group-hover:text-gray-900 ' : ' group-hover:text-white'}  `}
                >
                  <MessageSquare size={16} />
                </span>
                <span className="ml-3">My Reviews</span>
              </Link>
            </li>
            <li>
              <Link
                to="/bus-booking/browse-reviews"
                className={`flex items-center px-2 py-1 text-base font-normal ${Theme ? 'text-gray-900 rounded-lg  hover:bg-gray-100' : 'hover:bg-gray-700 text-white'}   group`}
              >
                <span
                  aria-hidden="true"
                  className={`flex justify-items-center scale-125 ${Theme ? 'text-gray-400 group-hover:text-gray-900 ' : ' group-hover:text-white'}  `}
                >
                  <Star size={16} />
                </span>
                <span className="ml-3">Browse Reviews</span>
              </Link>
            </li>
            <li>
              <button
                onClick={handleLogout}
                className={`flex items-center px-2 py-1 text-base font-normal ${Theme ? 'text-gray-900 rounded-lg  hover:bg-gray-100' : 'hover:bg-gray-700 text-white'}   group`}
              >
                <span
                  aria-hidden="true"
                  className={`flex justify-items-center scale-125 ${Theme ? 'text-error-500 group-hover:text-gray-900 ' : ' group-hover:text-white'}  `}
                >
                  <IoLogOut />
                </span>
                <span className="ml-3">Logout</span>
              </button>
            </li>
            <li className={'hidden'}>
              <button
                onClick={toggleDropdownPages}
                type="button"
                className="flex items-center p-2 w-full text-base font-normal text-gray-900 rounded-lg group hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700"
                aria-controls="dropdown-pages"
              >
                <span
                  aria-hidden="true"
                  className={`flex justify-items-center scale-125 ${Theme ? 'text-gray-400 group-hover:text-gray-900 ' : ' group-hover:text-black text-white'}  `}
                >
                  <MdManageAccounts />
                </span>
                <span
                  className={`flex-1 ml-3 text-left ${Theme ? 'text-gray-900' : 'text-white group-hover:text-black'} `}
                >
                  Manager
                </span>
                <span
                  aria-hidden="true"
                  className={`flex justify-items-center scale-[1.7] ${Theme ? 'text-gray-400 group-hover:text-gray-900 ' : ' group-hover:text-black  text-white'}  `}
                >
                  {!dropdownPages ? (
                    <MdOutlineArrowDropDown />
                  ) : (
                    <MdOutlineArrowDropUp />
                  )}
                </span>
              </button>
              {dropdownPages && (
                <ul className="">
                  <li>
                    <Link
                      to="#"
                      className={`flex items-center p-2 pl-8 text-base font-normal ${Theme ? ' text-gray-900 rounded-lg hover:bg-gray-100 ' : 'text-white hover:bg-gray-700'}`}
                    >
                      <span
                        aria-hidden="true"
                        className={`flex justify-items-center scale-125 ${Theme ? 'text-gray-400 group-hover:text-gray-900 ' : ' group-hover:text-black text-white'}  `}
                      >
                        <AiFillSchedule />
                      </span>
                      <span className={`pl-4`}>Manage Trip</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="#"
                      className={`flex items-center p-2 pl-8 text-base font-normal ${Theme ? ' text-gray-900 rounded-lg hover:bg-gray-100 ' : 'text-white hover:bg-gray-700'}`}
                    >
                      <span
                        aria-hidden="true"
                        className={`flex justify-items-center scale-125 ${Theme ? 'text-gray-400 group-hover:text-gray-900 ' : ' group-hover:text-black text-white'}  `}
                      >
                        <MdFeedback />
                      </span>
                      <span className={`pl-4`}>Manage Feeds</span>
                    </Link>
                  </li>
                </ul>
              )}
            </li>
          </ul>
        </div>
      </aside>
    </>
  );
}
