import api from "@/services/api";

export const heartbeat = () => api.post("/attendance/heartbeat");
export const getMyAttendance = () => api.get("/attendance/get-mine");
export const updateAttendance = (internId, date, status) =>
  api.patch(`/attendance/${internId}/${date}`, { status });
export const getAttendanceByIntern = (internId) =>
  api.get(`/attendance/intern/${internId}`);
export const getAttendanceByBatch = (batchId, date) =>
  api.get(`/attendance/batch/${batchId}`, { params: date ? { date } : {} });
export const getAttendanceByDate = (date) =>
  api.get("/attendance/get-by-date", { params: { date } });
