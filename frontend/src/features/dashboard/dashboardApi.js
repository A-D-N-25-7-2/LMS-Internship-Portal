import api from "@/services/api";

export const getDashboardData = () => api.get("/dashboard/");
export const getInternDashboardData = () => api.get("/dashboard/intern");
export const getMentorDashboardData = () => api.get("/dashboard/mentor");