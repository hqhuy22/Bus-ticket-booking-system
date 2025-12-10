import { useState, useEffect } from "react";
import PropTypes from "prop-types";

/**
 * Interactive Seat Map Component
 * Displays a visual bus seat layout with clickable seats
 * Shows different seat states: available, selected, booked, locked
 */
export default function SeatMap({
  seatMapConfig,
  totalSeats,
  bookedSeats = [],
  lockedSeats = [],
  selectedSeats = [],
  onSeatSelect,
  maxSeatsAllowed = 5,
  sessionId = null,
}) {
  const [seats, setSeats] = useState([]);
  const [hoveredSeat, setHoveredSeat] = useState(null);

  const initializeSeats = () => {
    if (seatMapConfig && seatMapConfig.seats) {
      const seatGrid = seatMapConfig.seats.map((row) =>
        row.map((cell) => {
          if (cell.type === "seat") {
            return {
              ...cell,
              seatNo: cell.seatNo,
              type: "seat",
              price: cell.price || seatMapConfig.basePrice || 0,
            };
          }
          return cell;
        })
      );
      setSeats(seatGrid);
    } else {
      generateDefaultLayout();
    }
  };

  const generateDefaultLayout = () => {
    const cols = 4; // 2 seats, aisle, 2 seats
    const rows = Math.ceil(totalSeats / cols);
    const defaultSeats = [];
    let seatNumber = 1;

    for (let r = 0; r < rows; r++) {
      const row = [];
      for (let c = 0; c < cols; c++) {
        if (seatNumber <= totalSeats) {
          if (c === 2) {
            row.push({ type: "aisle", seatNo: null });
          }
          row.push({
            type: "seat",
            seatNo: seatNumber++,
            price: 0,
          });
        } else {
          row.push({ type: "empty", seatNo: null });
        }
      }
      defaultSeats.push(row);
    }
    setSeats(defaultSeats);
  };

  useEffect(() => {
    initializeSeats();
  }, [seatMapConfig, totalSeats, bookedSeats, lockedSeats]);

  const getSeatStatus = (seatNo) => {
    if (!seatNo) return "empty";
    const seatNoStr = String(seatNo);

    if (
      bookedSeats.includes(seatNoStr) ||
      bookedSeats.includes(parseInt(seatNo))
    ) {
      return "booked";
    }

    const lockedSeat = lockedSeats.find(
      (l) => String(l.seatNumber) === seatNoStr
    );
    if (lockedSeat && lockedSeat.sessionId !== sessionId) {
      return "locked";
    }

    if (
      selectedSeats.includes(seatNoStr) ||
      selectedSeats.includes(parseInt(seatNo))
    ) {
      return "selected";
    }

    return "available";
  };

  const handleSeatClick = (seatNo) => {
    if (!seatNo || !onSeatSelect) return;
    const status = getSeatStatus(seatNo);
    if (status === "booked" || status === "locked") return;

    const seatNoStr = String(seatNo);
    const isSelected =
      selectedSeats.includes(seatNoStr) ||
      selectedSeats.includes(parseInt(seatNo));
    if (!isSelected && selectedSeats.length >= maxSeatsAllowed) {
      alert(`You can only select up to ${maxSeatsAllowed} seats`);
      return;
    }
    onSeatSelect(seatNo);
  };

  const getSeatClassName = (cell) => {
    if (cell.type !== "seat") {
      return cell.type === "blocked"
        ? "bg-gray-800 cursor-not-allowed"
        : cell.type === "aisle"
        ? "bg-transparent"
        : "bg-transparent";
    }

    const status = getSeatStatus(cell.seatNo);
    const baseClass =
      "relative w-10 h-10 sm:w-12 sm:h-12 rounded-t-lg border-2 flex items-center justify-center text-xs font-semibold transition-all duration-200 cursor-pointer";

    switch (status) {
      case "available":
        return `${baseClass} bg-white border-gray-300 hover:border-primary hover:bg-primary/10 text-gray-700`;
      case "selected":
        return `${baseClass} bg-primary border-primary text-white shadow-lg scale-105`;
      case "booked":
        return `${baseClass} bg-error-500 border-red-600 text-white cursor-not-allowed opacity-75`;
      case "locked":
        return `${baseClass} bg-yellow-400 border-yellow-500 text-gray-800 cursor-not-allowed opacity-75`;
      default:
        return `${baseClass} bg-gray-200 border-gray-300`;
    }
  };

  const getSeatTooltip = (cell) => {
    if (cell.type !== "seat") return "";

    const status = getSeatStatus(cell.seatNo);
    const price = cell.price ? ` - $${cell.price}` : "";

    switch (status) {
      case "available":
        return `Seat ${cell.seatNo}${price} - Click to select`;
      case "selected":
        return `Seat ${cell.seatNo}${price} - Selected`;
      case "booked":
        return `Seat ${cell.seatNo} - Already booked`;
      case "locked":
        return `Seat ${cell.seatNo} - Temporarily reserved by another user`;
      default:
        return `Seat ${cell.seatNo}`;
    }
  };

  return (
    <div className="w-full p-4 bg-gray-50 rounded-lg">
      <div className="flex justify-end mb-8 pr-8">
        <div className="flex items-center gap-2 bg-gray-700 text-white px-4 py-2 rounded-lg">
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="text-sm font-semibold">Driver</span>
        </div>
      </div>

      <div className="flex flex-col items-center gap-2">
        {seats.map((row, rowIndex) => (
          <div key={`row-${rowIndex}`} className="flex gap-2 items-center">
            {row.map((cell, colIndex) => {
              if (cell.type === "aisle") {
                return (
                  <div key={`aisle-${rowIndex}-${colIndex}`} className="w-8" />
                );
              }
              if (cell.type === "empty") {
                return (
                  <div
                    key={`empty-${rowIndex}-${colIndex}`}
                    className="w-10 h-10 sm:w-12 sm:h-12"
                  />
                );
              }
              if (cell.type === "blocked") {
                return (
                  <div
                    key={`blocked-${rowIndex}-${colIndex}`}
                    className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-800 rounded opacity-30"
                  />
                );
              }
              return (
                <div
                  key={`seat-${cell.seatNo || `${rowIndex}-${colIndex}`}`}
                  className={getSeatClassName(cell)}
                  onClick={() => handleSeatClick(cell.seatNo)}
                  onMouseEnter={() => setHoveredSeat(cell.seatNo)}
                  onMouseLeave={() => setHoveredSeat(null)}
                  title={getSeatTooltip(cell)}
                >
                  {cell.seatNo}
                  {cell.type === "seat" && (
                    <>
                      <span className="absolute left-0 top-1 w-1 h-6 bg-gray-400 rounded-l" />
                      <span className="absolute right-0 top-1 w-1 h-6 bg-gray-400 rounded-r" />
                    </>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {hoveredSeat && (
        <div className="mt-4 p-2 bg-gray-700 text-white text-center rounded text-sm">
          {seats.flat().find((s) => s.seatNo === hoveredSeat) &&
            getSeatTooltip(seats.flat().find((s) => s.seatNo === hoveredSeat))}
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-gray-300">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-white border-2 border-gray-300 rounded"></div>
          <span className="text-xs">Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-primary rounded"></div>
          <span className="text-xs">Selected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-error-500 rounded"></div>
          <span className="text-xs">Booked</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-yellow-400 rounded"></div>
          <span className="text-xs">Locked</span>
        </div>
      </div>

      {selectedSeats.length > 0 && (
        <div className="mt-4 p-3 bg-primary/10 border border-primary rounded-lg">
          <p className="text-sm font-semibold text-primary">
            Selected Seats: {selectedSeats.join(", ")} ({selectedSeats.length}/
            {maxSeatsAllowed})
          </p>
        </div>
      )}
    </div>
  );
}

SeatMap.propTypes = {
  seatMapConfig: PropTypes.shape({
    rows: PropTypes.number,
    cols: PropTypes.number,
    basePrice: PropTypes.number,
    seats: PropTypes.arrayOf(PropTypes.array),
  }),
  totalSeats: PropTypes.number.isRequired,
  bookedSeats: PropTypes.arrayOf(
    PropTypes.oneOfType([PropTypes.string, PropTypes.number])
  ),
  lockedSeats: PropTypes.arrayOf(
    PropTypes.shape({
      seatNumber: PropTypes.string,
      sessionId: PropTypes.string,
      expiresAt: PropTypes.string,
    })
  ),
  selectedSeats: PropTypes.arrayOf(
    PropTypes.oneOfType([PropTypes.string, PropTypes.number])
  ),
  onSeatSelect: PropTypes.func,
  maxSeatsAllowed: PropTypes.number,
  sessionId: PropTypes.string,
};
