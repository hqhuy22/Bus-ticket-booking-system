import { GoArrowRight } from 'react-icons/go';
import { Link } from 'react-router-dom';

export default function TopHeader({
  departureStation = '',
  arrivalStation = '',
  journeyDate = ' ',
}) {
  return (
    <div
      className={`flex justify-center items-center min-w-full  text-white bg-blue-950`}
    >
      <div
        className={`flex  justify-center sm:flex-row flex-col  items-center sm:gap-10 gap-2 px-8 py-6`}
      >
        <ul className="flex justify-start sm:gap-8 tracking-wide capitalize font-semibold align-text-top gap-4">
          <li className="sm:text-base text-sm tracking-wider">
            {departureStation}
          </li>
          <li className={`flex justify-center items-center text-ms`}>
            <GoArrowRight className={`scale-150`} />
          </li>
          <li className="sm:text-base text-sm tracking-wider">
            {arrivalStation}
          </li>
        </ul>
        <h2 className="sm:text-base text-sm tracking-wide capitalize font-semibold align-text-top">
          {journeyDate}
        </h2>
        <Link
          to={`/`}
          className={`text-center bg-tertiary px-8 sm:py-1.5 py-0.5 rounded-md sm:text-base text-sm font-semibold tracking-wider hover:bg-info-600 transition-all duration-700 delay-75 ease-linear`}
        >
          Modify
        </Link>
      </div>
    </div>
  );
}
