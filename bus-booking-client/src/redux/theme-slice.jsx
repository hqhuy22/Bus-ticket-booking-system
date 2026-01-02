import { createSlice } from '@reduxjs/toolkit';

const themeSlice = createSlice({
  name: 'theme',
  initialState: { lightTheme: true, isMobileOpen: false, textHover: true },
  reducers: {
    toggleTheme(state) {
      state.lightTheme = !state.lightTheme;
    },
    mobileOpen(state) {
      state.isMobileOpen = !state.isMobileOpen;
    },
    setTextHover(state) {
      state.textHover = !state.textHover;
    },
  },
});

export const toggleThemeAction = themeSlice.actions;
export default themeSlice.reducer;
