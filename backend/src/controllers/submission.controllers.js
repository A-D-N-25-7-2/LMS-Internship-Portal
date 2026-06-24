import { Submission } from "../models/submission.models.js";
import { Assignment } from "../models/assignment.models.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const submitAssignment = asyncHandler(async (req, res) => {
  const { assignment } = req.params;
  const { filePath, text } = req.body;
  const existingAssignment = await Assignment.findById(assignment);

  if (!existingAssignment) {
    throw new ApiError(404, "Assignment not found!!");
  }

  const isLate = new Date() > new Date(existingAssignment.dueDate);

  if (!Array.isArray(filePath)) {
    throw new ApiError(400, "File paths can only be in an array!!");
  }

  if (!text?.trim() && filePath.length == 0) {
    throw new ApiError(400, "Submission cannot be empty!!");
  }

  const submission = await Submission.create({
    assignment,
    intern: req.user._id,
    filePath,
    text: text.trim(),
    isLate,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, submission, "Assignment submitted."));
});

const resubmitAssignment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { filePath, text } = req.body;
  const submission = await Submission.findById(id).populate("assignment");

  if (!submission) {
    throw new ApiError(404, "Submission not found!!");
  }

  const isLate = new Date() > new Date(submission.assignment.dueDate);

  if (text != undefined) {
    if (!text.trim()) {
      throw new ApiError(400, "Text cannot be empty!!");
    }
    submission.text = text;
  }

  if (filePath != undefined) {
    if (!Array.isArray(filePath)) {
      throw new ApiError(400, "File paths can only be in an array!!");
    }
    submission.filePath = filePath;
  }

  submission.isLate = isLate;
  submission.status = "submitted";
  submission.marks = undefined;
  await submission.save();

  return res
    .status(200)
    .json(new ApiResponse(200, submission, "Assignment resubmitted."));
});

const getSubmissionsByAssignment = asyncHandler(async (req, res) => {
  const { assignment } = req.params;

  const existingAssignment = await Assignment.findById(assignment);

  if (!existingAssignment) {
    throw new ApiError(404, "Assignment not found!!");
  }

  const submissions = await Submission.find({ assignment }).populate(
    "intern",
    "name avatar",
  );

  return res
    .status(200)
    .json(new ApiResponse(200, submissions, "Submissions fetched."));
});

const getSubmissionByAssignment = asyncHandler(async (req, res) => {
  const { assignment } = req.params;

  const existingAssignment = await Assignment.findById(assignment);

  if (!existingAssignment) {
    throw new ApiError(404, "Assignment not found!!");
  }
  const submission = await Submission.find({ assigment, intern: req.user._id });

  return res
    .status(200)
    .json(new ApiResponse(200, submission, "Submissions fetched."));
});

const getSubmissionById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const submission = await Submission.findById(id);

  if (!submission) {
    throw new ApiError(404, "Submission not found!!");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, submission, "Submission fetched."));
});

const gradeSubmission = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { marks } = req.body;

  const submission = await Submission.findById(id);

  if (!submission) {
    throw new ApiError(404, "Submission not found!!");
  }

  if (marks != undefined) {
    throw new ApiError(400, "Marks cannot be empty!!");
  }

  submission.gradedBy = req.user._id;
  submission.marks = marks;
  submission.status = "graded";

  await submission.save();

  return res
    .status(200)
    .json(new ApiResponse(200, submission, "Submission graded."));
});

export {
  submitAssignment,
  resubmitAssignment,
  getSubmissionsByAssignment,
  getSubmissionByAssignment,
  getSubmissionById,
  gradeSubmission,
};
