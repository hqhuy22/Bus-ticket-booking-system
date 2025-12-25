import { ProfileInfo } from '../../utils/ProfileInfo.js';

export default function Profile() {
  return (
    <div className="relative flex flex-col gap-4 p-4 w-80 bg-black bg-opacity-80 rounded-xl shadow-inner">
      <div className="absolute inset-0 -z-10 rounded-xl overflow-hidden pointer-events-none">
        <div className="w-full h-full bg-gradient-to-b from-blue-800 via-blue-700 to-transparent"></div>
      </div>
      <div className="text-white">
        <div className="text-xl">Keys to Success</div>
        <p className="mt-1 text-sm text-gray-400">
          Best way to be success in your life.
        </p>
      </div>
      <hr className="my-2 border-t border-gray-700" />
      <ul className="flex flex-col gap-2">
        {ProfileInfo.map((info, index) => (
          <li className="flex items-start gap-2" key={`${info.id}-${index}`}>
            <span className="flex justify-center items-center mt-1 w-5 h-5 bg-success-500 rounded-full">
              <svg
                className="w-3.5 h-3.5 text-black"
                fill="currentColor"
                viewBox="0 0 16 16"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  clipRule="evenodd"
                  d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z"
                  fillRule="evenodd"
                />
              </svg>
            </span>
            <span className="text-xs text-white">
              <b>{info.title}</b> <br />
              {info.description}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
