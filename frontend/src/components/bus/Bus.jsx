import SeatInfo from './SeatInfo';
import { BusBookingInfo } from '../../utils/Bus';
import BusLayout from '../../layouts/BusLayout';

export default function Bus() {
  return (
    <div className={`min-w-full min-h-64 rounded-md overflow-x-hidden`}>
      <div
        className={`flex md:justify-center justify-start  items-center  sm:flex-col flex-col-reverse min-w-full  `}
      >
        <div
          className={`grid  grid-cols-4 sm:px-8  py-4 sm:gap-4 gap-2 justify-center items-center sm:pt-0 pt-10`}
        >
          {BusBookingInfo.map((info, index) => {
            return (
              <SeatInfo
                color={info.color}
                title={info.Title}
                index={`seat-info-${index}`}
                key={index}
              />
            );
          })}
        </div>
        <BusLayout />
      </div>
    </div>
  );
}
