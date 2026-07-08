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
      
      // Exclude large binary data from localStorage to avoid QuotaExceededError
      const userToStore = { ...action.payload.user };
      if (userToStore?.avatar) {
        userToStore.avatar = { ...userToStore.avatar };
        delete userToStore.avatar.data;
      }
      
      localStorage.setItem('user', JSON.stringify(userToStore));
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

export const updateAccountDetails = (data) =>
  api.patch("/auth/update", data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
export const changeCurrentPassword = (data) =>
  api.patch("/auth/change-password", data);
export const getCurrentUser = () => api.get("/auth/me");
export const removeAvatar = () => api.patch("/auth/remove-avatar");

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;

  


