export default function TextCard({ arr = [], customerStyle }) {
  return (
    <ul className="flex flex-col lg:px-4 space-y-2">
      {arr.map((info, index) => (
        <li
          key={`${info.title}${index}`}
          className={`flex justify-start items-start flex-col sm:space-y-0.5 ${
            customerStyle || ""
          }`}
        >
          <p className="lg:text-xs text-xs font-normal tracking-wide cursor-pointer capitalize">
            {info.title}
          </p>
          <h2 className="sm:text-xs text-xs font-bold uppercase cursor-pointer leading-6 tracking-widest">
            {info.description}
          </h2>
        </li>
      ))}
    </ul>
  );
}
