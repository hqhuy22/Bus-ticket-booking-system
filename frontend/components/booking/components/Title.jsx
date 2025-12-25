import { MdOutlineArrowDropDown, MdOutlineArrowDropUp } from 'react-icons/md';

export default function Title({ onClick, label, BookingClick }) {
  return (
    <ul
      className={`flex justify-between items-center px-4 py-1.5  bg-purple-500 text-white min-w-full`}
      onClick={onClick}
    >
      <li className={`md:text-base text-sm tracking-wide font-bold`}>
        {label}
      </li>
      <li>
        <span className={`scale-125`}>
          {!BookingClick ? (
            <MdOutlineArrowDropDown className={`h-6 w-6`} />
          ) : (
            <MdOutlineArrowDropUp className={`h-8 w-8`} />
          )}
        </span>
      </li>
    </ul>
  );
}
