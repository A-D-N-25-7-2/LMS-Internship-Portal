import api from "@/services/api";

export const getAllPermissions = () => api.get("/permissions/");
