import { useState } from "react";
import { vietnamCities } from "../data/cities";
import "../styles/search.css";

export const Search = () => {
  const [searchParams, setSearchParams] = useState({
    from: "",
    to: "",
    date: "",
    passengers: 1,
  });

  const [fromSuggestions, setFromSuggestions] = useState<string[]>([]);
  const [toSuggestions, setToSuggestions] = useState<string[]>([]);
  const [fromOpen, setFromOpen] = useState(false);
  const [toOpen, setToOpen] = useState(false);

  const [results, setResults] = useState<any[]>([
    {
      id: 1,
      from: "Hà Nội",
      to: "Hồ Chí Minh",
      departure: "08:00",
      arrival: "16:30",
      price: 450000,
      availableSeats: 5,
      duration: "8h 30m",
      busType: "Ghế Ngả",
    },
    {
      id: 2,
      from: "Hà Nội",
      to: "Hồ Chí Minh",
      departure: "14:00",
      arrival: "22:15",
      price: 500000,
      availableSeats: 12,
      duration: "8h 15m",
      busType: "Ghế Nằm",
    },
  ]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setSearchParams({ ...searchParams, [name]: value });

    if (name === "from") {
      if (value.trim()) {
        const filtered = vietnamCities.filter((city) =>
          city.toLowerCase().includes(value.toLowerCase())
        );
        setFromSuggestions(filtered);
        setFromOpen(true);
      } else {
        setFromSuggestions([]);
        setFromOpen(false);
      }
    }

    if (name === "to") {
      if (value.trim()) {
        const filtered = vietnamCities.filter((city) =>
          city.toLowerCase().includes(value.toLowerCase())
        );
        setToSuggestions(filtered);
        setToOpen(true);
      } else {
        setToSuggestions([]);
        setToOpen(false);
      }
    }
  };

  const handleSelectCity = (city: string, field: "from" | "to") => {
    setSearchParams({ ...searchParams, [field]: city });
    if (field === "from") {
      setFromSuggestions([]);
      setFromOpen(false);
    } else {
      setToSuggestions([]);
      setToOpen(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock search - in reality would call API
    console.log("Searching with:", searchParams);
  };

  return (
    <div className="search-container">
      <div className="search-header">
        <h1>Tìm Kiếm Chuyến Xe</h1>
      </div>

      <form className="search-form" onSubmit={handleSearch}>
        <div className="form-group">
          <input
            type="text"
            name="from"
            placeholder="Điểm đi"
            value={searchParams.from}
            onChange={handleChange}
            onFocus={() => setFromOpen(true)}
            onBlur={() => setTimeout(() => setFromOpen(false), 200)}
            required
          />
          {fromOpen && fromSuggestions.length > 0 && (
            <div className="suggestions-dropdown">
              {fromSuggestions.map((city) => (
                <div
                  key={city}
                  className="suggestion-item"
                  onMouseDown={() => handleSelectCity(city, "from")}
                >
                  {city}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="form-group">
          <input
            type="text"
            name="to"
            placeholder="Điểm đến"
            value={searchParams.to}
            onChange={handleChange}
            onFocus={() => setToOpen(true)}
            onBlur={() => setTimeout(() => setToOpen(false), 200)}
            required
          />
          {toOpen && toSuggestions.length > 0 && (
            <div className="suggestions-dropdown">
              {toSuggestions.map((city) => (
                <div
                  key={city}
                  className="suggestion-item"
                  onMouseDown={() => handleSelectCity(city, "to")}
                >
                  {city}
                </div>
              ))}
            </div>
          )}
        </div>
        <input
          type="date"
          name="date"
          value={searchParams.date}
          onChange={handleChange}
          required
        />
        <select
          name="passengers"
          value={searchParams.passengers}
          onChange={handleChange}
        >
          <option value={1}>1 Hành khách</option>
          <option value={2}>2 Hành khách</option>
          <option value={3}>3 Hành khách</option>
          <option value={4}>4+ Hành khách</option>
        </select>
        <button type="submit" className="search-btn">
          Tìm Kiếm
        </button>
      </form>

      <div className="results">
        <h2>Kết Quả Tìm Kiếm ({results.length} chuyến)</h2>
        <div className="trip-list">
          {results.map((trip) => (
            <div key={trip.id} className="trip-card">
              <div className="trip-route">
                <div className="station">
                  <p className="time">{trip.departure}</p>
                  <p className="city">{trip.from}</p>
                </div>
                <div className="trip-info">
                  <div className="duration">{trip.duration}</div>
                </div>
                <div className="station">
                  <p className="time">{trip.arrival}</p>
                  <p className="city">{trip.to}</p>
                </div>
              </div>
              <div className="trip-details">
                <span className="bus-type">{trip.busType}</span>
                <span className="seats">{trip.availableSeats} chỗ trống</span>
              </div>
              <div className="trip-footer">
                <span className="price">{trip.price.toLocaleString()} đ</span>
                <button className="book-btn">Đặt Vé</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
