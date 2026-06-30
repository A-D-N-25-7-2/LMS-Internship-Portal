import api from "@/services/api";

export const getAssignmentsByModule = (moduleId) =>
  api.get(`/assignments/list/${moduleId}`);
export const getAssignmentById = (id) => api.get(`/assignments/get-assignment/${id}`);
export const createAssignment = (moduleId, data) => api.post(`/assignments/create/${moduleId}`, data);
export const updateAssignment = (id, data) =>
  api.patch(`/assignments/update/${id}`, data);
export const deleteAssignment = (id) => api.delete(`/assignments/delete/${id}`);
export const createBatchConfig = (assignmentId, data) =>
  api.post(`/assignments/${assignmentId}/batch-config`, data);
export const getBatchConfigs = (assignmentId) =>
  api.get(`/assignments/${assignmentId}/batch-config`);
