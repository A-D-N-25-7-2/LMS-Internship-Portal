import { createSlice } from "@reduxjs/toolkit";
import  api  from "@/services/api";

const initialState = {
  user: JSON.parse(localStorage.getItem('user')) || null,
  permissions: JSON.parse(localStorage.getItem('permissions')) || [], // ["user:create", "batch:read", ...]
  isAuthenticated: !!localStorage.getItem('user'),
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      state.user = action.payload.user;
      state.permissions = action.payload.permissions || [];
      state.isAuthenticated = true;
      localStorage.setItem('user', JSON.stringify(action.payload.user));
      localStorage.setItem('permissions', JSON.stringify(action.payload.permissions || []));
    },
    logout: (state) => {
      state.user = null;
      state.permissions = [];
      state.isAuthenticated = false;
      localStorage.removeItem('user');
      localStorage.removeItem('permissions');
    },
  },
});

export const getCurrentUser = () => api.get("/auth/me");
export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;

  


