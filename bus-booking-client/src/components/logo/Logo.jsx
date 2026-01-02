import { Link } from 'react-router-dom';
import { LogoSource } from '../../utils/index.js';
import { useSelector } from 'react-redux';

export default function Logo() {
  const Theme = useSelector(state => state.theme.lightTheme);
  return (
    <div className="flex items-center space-x-3 rtl:space-x-reverse relative cursor-pointer">
      <Link to="/" className="flex items-center">
        <img
          src={LogoSource}
          className="h-8 w-8 scale-[2] z-5"
          alt="QTechy Bus booking system Logo"
        />
        <div className="flex flex-col items-center -translate-x-2 translate-y-1">
          <h1 className="text-info-600 text-sm font-bold">QTechy</h1>
          <span
            className={`text-[8px] ${Theme ? 'text-gray-500 ' : ' text-white '}  scale-50 font-bold `}
          >
            BUS TICKET BOOKING SYSTEM
          </span>
        </div>
      </Link>
    </div>
  );
}
