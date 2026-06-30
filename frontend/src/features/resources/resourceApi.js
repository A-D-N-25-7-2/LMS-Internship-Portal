import api from "@/services/api";

export const getResourcesByModule = (moduleId) =>
  api.get(`/resources/list/${moduleId}`);
export const getResourceById = (id) => api.get(`/resources/get-resource/${id}`);
export const createResource = (moduleId, data) => api.post(`/resources/create/${moduleId}`, data);
export const updateResource = (id, data) => api.patch(`/resources/update/${id}`, data);
export const deleteResource = (id) => api.delete(`/resources/delete/${id}`);
