import api from "@/services/api";

export const createCollege = (data) => api.post("/colleges/create", data);
export const updateCollege = (id, data) => api.patch(`/colleges/update/${id}`, data);
export const deleteCollege = (id) => api.delete(`/colleges/delete/${id}`);
export const getAllColleges = () => api.get("/colleges/list");
export const getCollegeById = (id) => api.get(`/colleges/get/${id}`);
