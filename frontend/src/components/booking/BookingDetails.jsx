import BookingForm from '../form/BookingForm';

export default function BookingDetails() {
  return (
    <div className={`min-w-full sm:col-span-3 col-span-1 sm:px-0  px-8`}>
      <div
        className={`bg-gray-200 text-black sm:py-2.5 py-1.5  px-4 rounded-md`}
      >
        <p
          className={`sm:text-base text-sm font-medium tracking-wide align-text-top `}
        >
          You have to complete your booking.
        </p>
      </div>
      <BookingForm />
    </div>
  );
}
