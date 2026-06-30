import axios from "axios";
import { store } from "../app/store";
import { logout } from "../features/auth/authSlice";

const api = axios.create({
  baseURL: "/api/v1",
  withCredentials: true,
});


api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const { data } = await axios.post(
          "/api/v1/auth/refresh-token",
          {},
          { withCredentials: true },
        );

        return api(originalRequest);
      } catch {
        store.dispatch(logout());
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  },
);

export default api;
