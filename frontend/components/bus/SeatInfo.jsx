import { useSelector } from 'react-redux';

export default function SeatInfo({ title, color, index }) {
  const Theme = useSelector(state => state.theme.lightTheme);
  return (
    <div className={`flex justify-items-center gap-1`} key={index}>
      <div
        className={`h-4 w-4 border-2 border-black ${color} rounded-sm hover:border-blue-300 transition-all duration-500 ease-linear cursor-pointer`}
      ></div>
      <div
        className={`flex justify-center items-center sm:gap-1 -translate-y-0.5 gap-4`}
      >
        <h2
          className={`text-xs  font-normal tracking-wide ${Theme ? 'text-gray-900' : 'text-white'} cursor-pointer`}
        >
          {title}
        </h2>
        <p
          className={`text-xs  font-normal tracking-wide ${Theme ? 'text-gray-900' : 'text-white'} cursor-pointer sm:flex hidden`}
        >
          Seats
        </p>
      </div>
    </div>
  );
}
