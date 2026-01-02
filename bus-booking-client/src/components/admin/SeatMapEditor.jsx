import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../utils/axiosConfig';

export default function SeatMapEditor({ bus, onClose, onSave }) {
  const navigate = useNavigate();
  const [rows, setRows] = useState(0);
  const [cols, setCols] = useState(0);
  const [grid, setGrid] = useState([]); // 2D array of cells
  const [selected, setSelected] = useState(null); // {r,c}

  useEffect(() => {
    if (!bus) return;
    const cfg = bus.seatMapConfig || null;
    if (cfg && cfg.rows && cfg.cols && cfg.seats) {
      setRows(cfg.rows);
      setCols(cfg.cols);
      setGrid(cfg.seats.map(row => row.map(cell => ({ ...cell }))));
    } else {
      // create a default grid based on totalSeats
      const total = bus.totalSeats || 40;
      const defaultCols = 4;
      const r = Math.ceil(total / defaultCols);
      const c = defaultCols;
      const seats = [];
      let seatNo = 1;
      for (let i = 0; i < r; i++) {
        const row = [];
        for (let j = 0; j < c; j++) {
          if (seatNo <= total) row.push({ type: 'seat', seatNo: seatNo++ });
          else row.push({ type: 'empty', seatNo: null });
        }
        seats.push(row);
      }
      setRows(r);
      setCols(c);
      setGrid(seats);
    }
  }, [bus]);

  const toggleCell = (r, c) => {
    setGrid(prev => {
      const next = prev.map(row => row.map(cell => ({ ...cell })));
      const cell = next[r][c];
      if (cell.type === 'empty') next[r][c] = { type: 'seat', seatNo: null };
      else if (cell.type === 'seat') next[r][c] = { ...cell, type: 'blocked' };
      else next[r][c] = { type: 'empty', seatNo: null };
      return next;
    });
  };

  const handleAutoNumber = () => {
    let num = 1;
    setGrid(prev =>
      prev.map(row =>
        row.map(cell => {
          if (cell.type === 'seat') return { ...cell, seatNo: num++ };
          return { ...cell, seatNo: null };
        })
      )
    );
  };

  const handleSave = async () => {
    if (!bus) return;
    const cfg = { rows, cols, seats: grid };
    try {
      const payload = { seatMapConfig: cfg };
      const res = await axios.put(`/api/bus/${bus.id}`, payload);
      onSave && onSave(res.data.bus || res.data);
      onClose && onClose();
    } catch (err) {
      console.error('Failed to save seat map', err);
      const status = err.response?.status;
      if (status === 401) {
        // Not authenticated - redirect to login
        alert(
          'You must be logged in as an admin to save the seat map. Redirecting to login...'
        );
        navigate('/bus-booking/login');
        return;
      }
      if (status === 403) {
        alert('Access denied. Admin privileges required to save seat map.');
        return;
      }
      alert(err.response?.data?.error || 'Failed to save seat map');
    }
  };

  if (!bus) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-6">
      <div className="bg-black/50 absolute inset-0" onClick={onClose}></div>
      <div className="relative bg-white rounded shadow-lg p-4 w-full max-w-4xl z-10">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold">
            Seat Map Editor — {bus.busNumber || bus.id}
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={handleAutoNumber}
              className="bg-gray-200 px-3 py-1 rounded"
            >
              Auto-number Seats
            </button>
            <button
              onClick={onClose}
              className="bg-error-500 text-white px-3 py-1 rounded"
            >
              Close
            </button>
          </div>
        </div>

        <div className="mb-3">
          <label className="block text-sm mb-1">Grid size</label>
          <div className="flex gap-2 items-center">
            <input
              type="number"
              min={1}
              value={rows}
              onChange={e => {
                const r = Math.max(1, parseInt(e.target.value || 0, 10));
                setRows(r);
                setGrid(prev => {
                  const next = [];
                  for (let i = 0; i < r; i++) {
                    const row = [];
                    for (let j = 0; j < cols; j++) {
                      row.push(
                        prev[i] && prev[i][j]
                          ? { ...prev[i][j] }
                          : { type: 'empty', seatNo: null, price: null }
                      );
                    }
                    next.push(row);
                  }
                  return next;
                });
              }}
              className="border p-1 rounded w-20"
            />
            <span>×</span>
            <input
              type="number"
              min={1}
              value={cols}
              onChange={e => {
                const c = Math.max(1, parseInt(e.target.value || 0, 10));
                setCols(c);
                setGrid(prev => {
                  const next = [];
                  for (let i = 0; i < rows; i++) {
                    const row = [];
                    for (let j = 0; j < c; j++) {
                      row.push(
                        prev[i] && prev[i][j]
                          ? { ...prev[i][j] }
                          : { type: 'empty', seatNo: null, price: null }
                      );
                    }
                    next.push(row);
                  }
                  return next;
                });
              }}
              className="border p-1 rounded w-20"
            />
          </div>
        </div>

        <div className="overflow-auto max-h-[50vh] mb-3">
          <div className="inline-block bg-gray-50 p-3 rounded">
            {grid.map((row, r) => (
              <div key={r} className="flex gap-2 mb-2">
                {row.map((cell, c) => (
                  <button
                    key={c}
                    onClick={() => {
                      setSelected({ r, c });
                      toggleCell(r, c);
                    }}
                    className={`w-16 h-12 flex flex-col items-center justify-center border rounded ${cell.type === 'seat' ? 'bg-white' : cell.type === 'blocked' ? 'bg-red-100' : 'bg-transparent'}`}
                  >
                    <div className="text-xs">{cell.type}</div>
                    <div className="font-semibold">{cell.seatNo ?? ''}</div>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3 items-center">
          <div>
            <label className="block text-sm">Selected cell</label>
            <div className="p-2 border rounded w-64">
              {selected ? (
                (() => {
                  const c = grid[selected.r][selected.c];
                  return (
                    <div>
                      <div className="text-sm">
                        Type: <strong>{c.type}</strong>
                      </div>
                      <div className="mt-2">
                        Seat No:{' '}
                        <input
                          type="number"
                          value={c.seatNo ?? ''}
                          onChange={e => {
                            const v =
                              e.target.value === ''
                                ? null
                                : Number(e.target.value);
                            setGrid(prev => {
                              const next = prev.map(row =>
                                row.map(cell => ({ ...cell }))
                              );
                              next[selected.r][selected.c].seatNo = v;
                              return next;
                            });
                          }}
                          className="border p-1 rounded w-24"
                        />
                      </div>
                      <div className="mt-2">
                        Set as blocked:{' '}
                        <input
                          type="checkbox"
                          checked={c.type === 'blocked'}
                          onChange={e => {
                            setGrid(prev => {
                              const next = prev.map(row =>
                                row.map(cell => ({ ...cell }))
                              );
                              next[selected.r][selected.c].type = e.target
                                .checked
                                ? 'blocked'
                                : 'seat';
                              return next;
                            });
                          }}
                        />
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div className="text-sm text-gray-600">
                  No cell selected — click a cell to toggle seat/blocked/empty
                  and edit properties.
                </div>
              )}
            </div>
          </div>

          <div className="ml-auto flex gap-2">
            <button
              onClick={handleSave}
              className="bg-success-600 text-white px-4 py-2 rounded"
            >
              Save Seat Map
            </button>
            <button onClick={onClose} className="bg-gray-200 px-4 py-2 rounded">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
