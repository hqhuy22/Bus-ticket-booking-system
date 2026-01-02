import { IoIosMenu } from 'react-icons/io';
import Switch from '../button/Switch';
import Logo from '../logo/Logo';
import { useSelector } from 'react-redux';

export default function MobileHeader({ onClick }) {
  const Theme = useSelector(state => state.theme.lightTheme);
  return (
    <div
      className={`sm:hidden flex justify-between items-center px-8 py-4 ${Theme ? 'bg-white' : 'bg-gray-900'} `}
    >
      <Logo />
      <div className={`flex justify-between items-center `}>
        <div
          className={`sm:hidden flex justify-center items-center scale-[0.8] translate-x-5 translate-y-1 `}
        >
          <Switch />
        </div>
        <button
          onClick={onClick}
          aria-controls="default-sidebar"
          type="button"
          className={`inline-flex items-center p-2 mt-2 ml-3 text-sm ${Theme ? 'text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 ' : 'text-gray-400 hover:bg-gray-700 focus:ring-gray-600'}  rounded-lg sm:hidden `}
        >
          <span className="sr-only">Open sidebar</span>
          <span className={`scale-[1.75] z-50`}>
            <IoIosMenu />
          </span>
        </button>
      </div>
    </div>
  );
}
