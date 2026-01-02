import { createSlice } from '@reduxjs/toolkit';

const bookingSlice = createSlice({
  name: 'booking',
  initialState: {
    bookingList: [],
    totalPrice: 0,
    bankCharge: 14.72,
    convenieceFee: 110.0,
    seatCount: 0,
  },
  reducers: {
    findBus(state, action) {
      const newBookingList = action.payload;
      state.bookingList.push({
        journeySummary: {
          departure: newBookingList.departureStation,
          arrival: newBookingList.arrivalStation,
          bookingDate: [
            {
              startSession: newBookingList.journeyDate,
              endSession: {},
              startTime: {},
              endTime: {},
            },
          ],
        },
      });
    },
  },
});

export const BookingActions = bookingSlice.actions;
export default bookingSlice.reducer;
