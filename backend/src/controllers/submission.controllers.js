import { Submission } from "../models/submission.models.js";
import { Assignment } from "../models/assignment.models.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const submitAssignment = asyncHandler(async (req, res) => {
  const { assignment } = req.params;
  const { links, text } = req.body;
  const existingAssignment = await Assignment.findById(assignment);

  if (!existingAssignment) {
    throw new ApiError(404, "Assignment not found!!");
  }

  const isLate = existingAssignment.dueDate ? new Date() > new Date(existingAssignment.dueDate) : false;

  let parsedLinks = [];
  if (links !== undefined) {
    parsedLinks = typeof links === "string" ? JSON.parse(links) : links;
    if (!Array.isArray(parsedLinks)) {
      throw new ApiError(400, "Links can only be in an array!!");
    }
  }

  const uploadedFiles = req.files || [];
  const filesData = uploadedFiles.map((file) => ({
    name: file.originalname,
    data: file.buffer,
    contentType: file.mimetype,
  }));

  if (!text?.trim() && parsedLinks.length === 0 && filesData.length === 0) {
    throw new ApiError(400, "Submission cannot be empty!!");
  }

  const submission = await Submission.create({
    assignment,
    intern: req.user._id,
    links: parsedLinks,
    files: filesData,
    text: text?.trim(),
    isLate,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, submission, "Assignment submitted."));
});

const resubmitAssignment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { links, text } = req.body;
  const submission = await Submission.findById(id).populate("assignment");

  if (!submission) {
    throw new ApiError(404, "Submission not found!!");
  }

  const isLate = submission.assignment?.dueDate ? new Date() > new Date(submission.assignment.dueDate) : false;

  if (text != undefined) {
    submission.text = text.trim();
  }

  if (links != undefined) {
    const parsedLinks = typeof links === "string" ? JSON.parse(links) : links;
    if (!Array.isArray(parsedLinks)) {
      throw new ApiError(400, "Links can only be in an array!!");
    }
    submission.links = parsedLinks;
  }

  if (req.body.remainingFiles !== undefined) {
    const remaining = typeof req.body.remainingFiles === "string" ? JSON.parse(req.body.remainingFiles) : req.body.remainingFiles;
    if (Array.isArray(remaining)) {
      submission.files = submission.files.filter((f) => remaining.includes(f._id.toString()));
    }
  }

  const uploadedFiles = req.files || [];
  if (uploadedFiles.length > 0) {
    const newFilesData = uploadedFiles.map((file) => ({
      name: file.originalname,
      data: file.buffer,
      contentType: file.mimetype,
    }));
    submission.files.push(...newFilesData);
  }

  if (!submission.text?.trim() && submission.links.length === 0 && submission.files.length === 0) {
    throw new ApiError(400, "Submission cannot be empty!!");
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

  const submissions = await Submission.find({ assignment })
    .populate("intern", "username")
    .select("-files.data");

  return res
    .status(200)
    .json(new ApiResponse(200, submissions, "Submissions fetched."));
});

const getMySubmission = asyncHandler(async (req, res) => {
  const { assignment } = req.params;

  const existingAssignment = await Assignment.findById(assignment);

  if (!existingAssignment) {
    throw new ApiError(404, "Assignment not found!!");
  }
  const submission = await Submission.find({ assignment, intern: req.user._id })
    .select("-files.data");

  return res
    .status(200)
    .json(new ApiResponse(200, submission, "Submissions fetched."));
});

const gradeSubmission = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { marks } = req.body;

  const submission = await Submission.findById(id);

  if (!submission) {
    throw new ApiError(404, "Submission not found!!");
  }

  if (marks === undefined || marks === null || isNaN(marks)) {
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

const getSubmissionFile = asyncHandler(async (req, res) => {
  const { id, index } = req.params;

  const submission = await Submission.findById(id);

  if (!submission) {
    throw new ApiError(404, "Submission not found!!");
  }

  const idx = parseInt(index, 10);
  if (isNaN(idx) || idx < 0 || idx >= submission.files.length) {
    throw new ApiError(404, "File not found!!");
  }

  const file = submission.files[idx];

  res.setHeader("Content-Type", file.contentType);
  res.setHeader(
    "Content-Disposition",
    `inline; filename="${encodeURIComponent(file.name)}"`
  );

  return res.status(200).send(file.data);
});

export {
  submitAssignment,
  resubmitAssignment,
  getSubmissionsByAssignment,
  getMySubmission,
  gradeSubmission,
  getSubmissionFile,
};
