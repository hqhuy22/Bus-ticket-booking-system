export default function SubTitle({ arr = [] }) {
  return (
    <ul className={`flex justify-between min-w-full px-4`}>
      {arr.map((item, index) => {
        return (
          <li key={`${index}`} className={`${item.type && 'text-right'} `}>
            <p className={`font-light text-xs`}>{item.title}</p>
            <h2 className={`font-semibold text-sm`}>{item.desc}</h2>
          </li>
        );
      })}
    </ul>
  );
}
