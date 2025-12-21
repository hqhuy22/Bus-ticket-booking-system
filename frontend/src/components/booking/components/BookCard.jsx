import { useState } from 'react';
import SubTitle from './SubTitle';
import { BookingTitles } from '../../../utils/Bus.js';
import Title from './Title';

export default function BookCard({ label, mainTitle }) {
  const [BookingClick, setBookingClick] = useState(false);
  const handleClick = () => {
    setBookingClick(!BookingClick);
  };

  const BTI = [
    {
      arr: BookingTitles[0].TitleInfo1,
      id: 1,
    },
    {
      arr: BookingTitles[0].TitleInfo2,
      id: 2,
    },
    {
      arr: BookingTitles[0].TitleInfo3,
      id: 3,
    },
  ];

  const bills = [
    {
      title: 'Bus Fare',
      amount: '1,292.00',
    },
    {
      title: 'Conveniece Fee',
      amount: '110.00',
    },
    {
      title: 'Bank Charges',
      amount: '14.50',
    },
    {
      title: 'Total Pay',
      amount: '1,516.72',
      type: true,
    },
  ];

  return (
    <div className={`flex flex-col justify-start items-start`}>
      <Title
        onClick={() => handleClick()}
        label={label}
        BookingClick={BookingClick}
      />
      <div
        className={` ${BookingClick ? 'flex' : 'hidden'} flex-col justify-start items-start min-w-full  py-4 bg-gray-100 text-black gap-2`}
      >
        <div
          className={`${mainTitle ? 'flex' : 'hidden'}   flex-col justify-center items-center min-w-full tracking-wide cursor-pointer align-text-top pb-2`}
        >
          <p className={`font-light text-xs`}>Depot Name</p>
          <h2 className={`font-bold text-sm`}>Wellsara</h2>
        </div>
        {mainTitle
          ? BTI.map((item, index) => {
              return <SubTitle arr={item.arr} key={`${item.id}-${index}`} />;
            })
          : bills.map((item, index) => {
              return (
                <div
                  className="flex flex-col min-w-full gap-0.5  px-4"
                  key={`pay-${index}`}
                >
                  <ul className="flex justify-between min-w-full">
                    <li className={``}>
                      <h2
                        className={`${item.type === true ? 'font-semibold' : 'font-normal'} text-sm`}
                      >
                        {item.title}
                      </h2>
                    </li>
                    <li className={``}>
                      <h2
                        className={`${item.type === true ? 'font-semibold' : 'font-semibold'} text-sm`}
                      >
                        {item.amount}
                      </h2>
                    </li>
                  </ul>
                </div>
              );
            })}
      </div>
    </div>
  );
}
