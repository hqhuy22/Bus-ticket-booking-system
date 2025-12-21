import PaymentOptions from './PaymentOptions';
import Features from './Features';

export default function SectionCard({ title, Option }) {
  return (
    <div className={`py-16 ${Option && 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
          {title}
        </h2>
        {Option === 'Payment Options' ? <PaymentOptions /> : <Features />}
      </div>
    </div>
  );
}
