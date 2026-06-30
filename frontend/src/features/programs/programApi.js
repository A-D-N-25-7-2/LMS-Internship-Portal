import api from "@/services/api";

export const getAllPrograms = () => api.get("/programs/list");
export const getProgramById = (id) => api.get(`/programs/get-program/${id}`);
export const createProgram = (data) => api.post("/programs/create", data);
export const updateProgram = (id, data) =>
  api.patch(`/programs/update/${id}`, data);
export const deleteProgram = (id) => api.delete(`/programs/delete/${id}`);
