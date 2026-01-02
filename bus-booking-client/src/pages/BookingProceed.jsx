import { createContext } from 'react';
import BookingInfo from '../components/booking/BookingInfo';
import BookingDetails from '../components/booking/BookingDetails';

const BookingContext = createContext();

export default function BookingProceed() {
  return (
    <BookingContext.Provider value={{}}>
      <div className={`flex flex-col  min-h-[80vh] md:px-8 pt-24`}>
        <div
          className={`grid sm:grid-cols-4 grid-cols-1 justify-normal items-start min-w-full md:gap-8 gap-6 sm:p-8`}
        >
          <BookingDetails />
          <BookingInfo />
        </div>
      </div>
    </BookingContext.Provider>
  );
}
