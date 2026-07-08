import api from "@/services/api";

export const getAllBatches = (programId) => api.get("/batches/list", {
  params: programId ? { program: programId } : {},
});
export const createBatch = (data) => api.post("/batches/create", data);
export const updateBatch = (id, data) => api.patch(`/batches/update/${id}`, data);
export const deleteBatch = (id) => api.delete(`/batches/delete/${id}`);
export const getBatchById = (id) => api.get(`/batches/get-batch/${id}`);
export const getAllInternsByBatch = (batchId) => api.get(`/users/list-interns/${batchId}`);