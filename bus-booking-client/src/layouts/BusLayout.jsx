import { BusSeatInfo } from '../utils/Bus.js';
import SeatColumn from '../components/bus/SeatColumn.jsx';
import { useNavigate } from 'react-router-dom';
import { GiSteeringWheel } from 'react-icons/gi';

export default function BusLayout() {
  const navigate = useNavigate();
  const handleClick = () => {
    navigate('/bus-booking/booking-process');
  };
  const SeatColumnInfo = [
    {
      Info: BusSeatInfo[0].column1,
      style: false,
    },
    {
      Info: BusSeatInfo[0].column2,
      style: false,
    },
    {
      Info: BusSeatInfo[0].column3,
      style: false,
    },
    {
      Info: BusSeatInfo[0].column4,
      style: true,
    },
    {
      Info: BusSeatInfo[0].column5,
      style: false,
    },
    {
      Info: BusSeatInfo[0].column6,
      style: false,
    },
  ];

  return (
    <div
      className={`flex sm:justify-start justify-center items-start sm:p-8 sm:min-w-fit min-w-full sm:flex-row flex-col `}
    >
      <div
        className={`flex justify-center items-center  my-3 mx-2 sm:min-w-fit min-w-full`}
      >
        <div
          className={` flex justify-center items-center  rounded-full sm:-translate-x-1 translate-x-16`}
        >
          <span className={`min-w-full min-h-full sm:rotate-90 `}>
            <GiSteeringWheel className="w-10 h-10" />
          </span>
        </div>
      </div>
      <div
        className={`flex sm:flex-col flex-row-reverse sm:justify-start justify-center sm:min-w-fit min-w-full items-start sm:scale-100 scale-125 sm:translate-y-0 translate-y-12`}
      >
        {SeatColumnInfo.map((info, index) => {
          return (
            <SeatColumn
              arr={info.Info}
              customerStyle={info.style}
              key={index}
            />
          );
        })}

        <div
          className={`min-w-full justify-end items-center py-8 sm:flex hidden`}
        >
          <button
            onClick={() => handleClick()}
            className={`bg-primary text-white py-2 px-4 rounded-md text-sm font-semibold tracking-wide cursor-pointer`}
          >
            Proceed
          </button>
        </div>
      </div>
      <div
        className={`min-w-full justify-end items-center flex sm:hidden mt-20 px-8`}
      >
        <button
          onClick={() => handleClick()}
          className={`bg-primary text-white py-1 px-2 rounded-md text-sm font-semibold tracking-wide cursor-pointer`}
        >
          Proceed
        </button>
      </div>
    </div>
  );
}
