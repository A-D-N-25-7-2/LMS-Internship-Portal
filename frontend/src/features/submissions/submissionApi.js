import api from "@/services/api";

export const submitAssignment = (assignmentId, data) =>
  api.post(`/submissions/create/${assignmentId}`, data);

export const resubmitAssignment = (submissionId, data) =>
  api.patch(`/submissions/update/${submissionId}`, data);

export const getMySubmission = (assignmentId) =>
  api.get(`/submissions/get-my-submission/${assignmentId}`);

export const getSubmissionsByAssignment = (assignmentId) =>
  api.get(`/submissions/list/${assignmentId}`);


export const gradeSubmission = (submissionId, marks) =>
  api.patch(`/submissions/grade/${submissionId}`, { marks });

export const getSubmissionFile = (submissionId, index) =>
  api.get(`/submissions/file/${submissionId}/${index}`, { responseType: "blob" });

