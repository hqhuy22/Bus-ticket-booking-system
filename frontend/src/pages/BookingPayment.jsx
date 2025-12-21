import TopHeader from '../components/payment/TopHeader';
import PaymentForm from '../components/form/PaymentForm';

export default function BookingPayment() {
  return (
    <div className={`flex flex-col min-h-[80vh] md:px-8 pt-24 2xl:mx-32`}>
      <TopHeader />
      <div
        className={`flex justify-center items-start pt-8 sm:mx-8 px-6 pb-16`}
      >
        <div
          className={`max-w-3xl w-full min-h-32 sm:border-2 rounded-xl sm:py-6 sm:px-10 border-gray-200`}
        >
          <div className={`border-b-2 border-gray-200`}>
            <h2
              className={`text-xl pb-2 font-bold tracking-wider align-text-top cursor-pointer`}
            >
              Payment Details
            </h2>
          </div>
          <PaymentForm />
        </div>
      </div>
    </div>
  );
}
