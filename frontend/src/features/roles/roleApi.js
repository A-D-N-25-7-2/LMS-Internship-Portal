import api from "@/services/api";

export const getAllRoles = () => api.get("/roles/list");
export const getRoleById = (id) => api.get(`/roles/get-role/${id}`);
export const createRole = (data) => api.post("/roles/create", data);
export const updateRole = (id, data) => api.patch(`/roles/update/${id}`, data);
export const deleteRole = (id) => api.delete(`/roles/delete/${id}`);
