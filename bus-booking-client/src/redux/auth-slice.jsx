import { createSlice } from '@reduxjs/toolkit';

// Check if user is logged in from localStorage
const checkAuth = () => {
  const token = localStorage.getItem('token');
  return !!token; // Convert to boolean
};

const authSlice = createSlice({
  name: 'auth',
  initialState: { isLoggedIn: checkAuth() },
  reducers: {
    login(state) {
      state.isLoggedIn = true;
    },
    logout(state) {
      state.isLoggedIn = false;
    },
  },
});

export const authActions = authSlice.actions;
export default authSlice.reducer;
