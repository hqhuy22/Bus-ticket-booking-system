import { createSlice } from '@reduxjs/toolkit';

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState: { activeTab: 'upcoming' },
  reducers: {
    tapChange(state, action) {
      state.lightTheme = action.payload;
    },
  },
});

export const dashboardAction = dashboardSlice.actions;
export default dashboardSlice.reducer;
