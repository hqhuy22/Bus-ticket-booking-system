import { GiHamburgerMenu } from 'react-icons/gi';
import { useSelector } from 'react-redux';

export default function MenuButton({ onClick }) {
  const Theme = useSelector(state => state.theme.lightTheme);

  return (
    <button
      data-collapse-toggle="navbar-default"
      type="button"
      className={`inline-flex items-center p-1 w-10 h-10 justify-center text-sm ${Theme ? 'text-primary hover:bg-gray-100 focus:ring-gray-200  ' : 'text-primary hover:bg-gray-700 focus:ring-gray-600'}  rounded-lg md:hidden focus:outline-none focus:ring-1 `}
      aria-controls="navbar-default"
      aria-expanded="false"
      onClick={onClick}
    >
      <span className="sr-only">Open main menu</span>
      <GiHamburgerMenu className="w-6 h-6" />
    </button>
  );
}
