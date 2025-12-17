import PaymentForm from "../components/payment/PaymentForm";

export default function PaymentPage() {
  return (
    <div className="flex flex-col min-h-[80vh] md:px-8 pt-24 2xl:mx-32">
      <div className="px-4">
        <h1 className="text-2xl font-bold tracking-wide text-gray-800">Payment Details</h1>
        <p className="text-sm text-gray-600 mt-1">
          Enter your card information to complete the booking payment.
        </p>
      </div>
      <div className="flex justify-center items-start pt-8 sm:mx-8 px-6 pb-16">
        <div className="max-w-3xl w-full min-h-32 sm:border-2 rounded-xl sm:py-6 sm:px-10 border-gray-200 bg-white shadow-sm">
          <div className="border-b-2 border-gray-200 pb-2 mb-4">
            <h2 className="text-lg font-semibold tracking-wide">Payment Details</h2>
          </div>
          <PaymentForm />
        </div>
      </div>
    </div>
  );
}
