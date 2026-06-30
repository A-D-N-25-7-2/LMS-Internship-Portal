import api from "@/services/api";

export const getAllModules = (programId) =>
  api.get("/modules/list", {
    params: programId ? { program: programId } : {},
  });
export const createModule = (data) => api.post("/modules/create", data);
export const updateModule = (id, data) =>
  api.patch(`/modules/update/${id}`, data);
export const deleteModule = (id) => api.delete(`/modules/delete/${id}`);
export const getModuleById = (id) => api.get(`/modules/get-module/${id}`);
