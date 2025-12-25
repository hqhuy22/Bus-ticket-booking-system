import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { toggleThemeAction } from '../../redux/theme-slice';
import { MdDarkMode, MdLightMode } from 'react-icons/md';

export default function Switch({ customerStyle }) {
  const dispatch = useDispatch();
  const [buttonClick, SetButtonClick] = useState(true);
  const handleTheme = () => {
    SetButtonClick(!buttonClick);
    dispatch(toggleThemeAction.toggleTheme());
  };

  return (
    <div
      className={` ${customerStyle ? 'md:flex hidden' : 'md:hidden flex'}  justify-items-center scale-75`}
    >
      <button
        onClick={handleTheme}
        className={`p-2 px-4 rounded-full ${buttonClick ? 'text-gray-500 ' : 'text-gray-400 '}`}
      >
        {buttonClick ? (
          <MdDarkMode className={`w-6 h-6 scale-125 `} />
        ) : (
          <MdLightMode className={`w-6 h-6 scale-125`} />
        )}
      </button>
    </div>
  );
}
