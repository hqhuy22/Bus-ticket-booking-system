import { Search, Support, MoneyTransfer, Map } from '../../utils/index.js';
export default function Features() {
  const features = [
    {
      title: 'More Choices',
      icon: Search,
      description:
        'We give you maximum choices across all the routes to choose your bus.',
    },
    {
      title: 'Customer Support',
      icon: Support,
      description: 'We help you to make your journey better.',
    },
    {
      title: 'Best Price',
      icon: MoneyTransfer,
      description: 'We always offer best bus ticket price in the market.',
    },
    {
      title: 'Google Map Location',
      icon: Map,
      description:
        'We send you the boarding place and destination place link in google map.',
    },
  ];

  return (
    <div className="grid md:grid-cols-4 gap-8 sm:px-0 px-8">
      {features.map(feature => (
        <div
          key={feature.title}
          className="flex flex-col items-center text-center"
        >
          <div className="text-4xl mb-4">
            <img
              src={feature.icon}
              alt={feature.title}
              className="cursor-pointer"
            />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            {feature.title}
          </h3>
          <p className="text-gray-600">{feature.description}</p>
        </div>
      ))}
    </div>
  );
}
