import { useState } from 'react';

export default function Seats({ count, type, index, space }) {
  const [bookingType, setBookingType] = useState({
    type: '',
    count: '',
  });

  const handleBookingSeats = (count, type) => {
    type === 'available' &&
      setBookingType({
        type: 'booking',
        count: count,
      });

    bookingType.type === 'booking' &&
      setBookingType({
        type: 'available',
        count: count,
      });

    console.log(`count - ${count} : ${type}`);
  };

  return (
    <ul
      className={`flex justify-start items-start p-2 relative   sm:rotate-0 rotate-90 ${space && 'sm:ml-14 sm:mt-0 mt-8'}  sm:scale-100  scale-125`}
      key={index}
      onClick={() => handleBookingSeats(count, type)}
    >
      <li
        className={`flex justify-center items-center sm:h-7 sm:w-7 w-4 h-4 rounded-l border-[1px] border-r-0 border-black ${type === 'counter' && 'bg-tertiary cursor-not-allowed'} ${type === 'Available' && 'bg-white cursor-pointer '} ${bookingType.type === 'booking' && 'bg-primary'}   `}
      >
        <h2
          className={`sm:text-xs customer-text-sm tracking-wide font-semibold sm:rotate-0 -rotate-90`}
        >
          {count}
        </h2>
      </li>
      <li
        className={`sm:h-7 h-4 sm:w-2 w-1 border-[1px] border-l-0 rounded-r border-black bg-white`}
      ></li>
      <li
        className={`sm:w-1 w-0.5 sm:h-3 h-1.5 border-[1px] border-black bg-black absolute sm:right-3.5 right-[11px] sm:top-4 top-3 rounded-[1px] `}
      ></li>
      <li
        className={`sm:w-3 sm:h-1 w-1.5 h-0.5 border-[1px] border-black rounded-r-full rounded-l-full z-10 absolute sm:left-5 left-3.5 sm:top-1.5 bg-white sm:scale-100 scale-110`}
      ></li>
      <li
        className={`sm:w-3 sm:h-1 w-1.5 h-0.5 border-[1px] border-black rounded-r-full rounded-l-full z-10 absolute sm:left-5 left-3.5 sm:bottom-1.5 bottom-2 sm:scale-100 scale-110 bg-white`}
      ></li>
    </ul>
  );
}
