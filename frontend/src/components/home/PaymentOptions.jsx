import {
  VisaCard,
  Mastercard,
  Genie,
  AmericaCard,
  MoneyTransfer,
} from '../../utils/index.js';

export default function PaymentOptions() {
  const options = [
    {
      name: 'Visa Card',
      icon: VisaCard,
    },
    {
      name: 'Master Card',
      icon: Mastercard,
    },
    {
      name: 'Genie',
      icon: Genie,
    },
    {
      name: 'American Express (AMEX)',
      icon: AmericaCard,
    },
    {
      name: 'Bank Transfer',
      icon: MoneyTransfer,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
      {options.map(option => (
        <div key={option.name} className="flex flex-col items-center">
          <div className="text-4xl mb-4">
            <img
              src={option.icon}
              alt={option.title}
              className="cursor-pointer"
            />
          </div>
          <h3 className="text-gray-700 text-center">{option.name}</h3>
        </div>
      ))}
    </div>
  );
}
