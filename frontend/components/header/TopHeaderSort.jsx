import PropTypes from 'prop-types';

export default function TopHeaderSort({
  onSortChange,
  currentSort,
  sortOrder,
}) {
  const sortOptions = [
    { label: 'Departure Time', value: 'departure_time' },
    { label: 'Arrival time', value: 'arrival_time' },
    { label: 'Available seats', value: 'availableSeats' },
    { label: 'Price', value: 'price' },
  ];

  return (
    <div
      className={
        'flex justify-center items-center px-8 py-4 bg-gray-200 min-w-full'
      }
    >
      <ul
        className={
          'flex justify-start items-center flex-wrap gap-4 uppercase sm:text-sm text-sm tracking-wider font-semibold'
        }
      >
        <li className={'text-black cursor-pointer'}>sort by:</li>
        {sortOptions.map(option => (
          <li
            key={option.value}
            onClick={() => onSortChange && onSortChange(option.value)}
            className={`cursor-pointer transition-all duration-500 ease-linear ${
              currentSort === option.value
                ? 'text-primary scale-110'
                : 'text-gray-500 hover:scale-110 hover:text-primary'
            }`}
          >
            {option.label}{' '}
            {currentSort === option.value && (sortOrder === 'ASC' ? '↑' : '↓')}
          </li>
        ))}
      </ul>
    </div>
  );
}

TopHeaderSort.propTypes = {
  onSortChange: PropTypes.func,
  currentSort: PropTypes.string,
  sortOrder: PropTypes.string,
};
