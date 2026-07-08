import api from "@/services/api";

export const getAllUsers = () => api.get("/users/list");
export const getUserById = (id) => api.get(`/users/get-user/${id}`);
export const createUser = (data) => api.post("/users/create", data);
export const updateUser = (id, data) => api.patch(`/users/update/${id}`, data);
export const toggleUserActive = (id) =>
  api.patch(`/users/toggle-active-status/${id}`);
export const deleteUser = (id) => api.delete(`/users/delete/${id}`);
export const getAllRoles = () => api.get("/roles/list-names");
export const getAllBatches = () => api.get("/batches/list-names");
export const getAllPrograms = () => api.get("/programs/list-names");
export const getAllColleges = () => api.get("/colleges/list-names");
