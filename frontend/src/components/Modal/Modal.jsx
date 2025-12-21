export default function Modal({ isVisible, header, body, footer }) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 sm:px-0 px-8 z-30">
      <div className="bg-white rounded-lg shadow-lg">
        <div
          className={`font-semibold sm:text-lg text-base sm:mb-4 mb-2 bg-green-300 px-6 py-2 rounded-t-lg sm:text-left text-center  tracking-wide`}
        >
          <h2>{header}</h2>
        </div>
        <div className="mb-4  sm:px-6 px-4">{body}</div>
        <div className="flex justify-between px-6 pb-6">{footer}</div>
      </div>
    </div>
  );
}
