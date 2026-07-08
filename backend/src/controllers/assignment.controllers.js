import { Module } from "../models/module.models.js";
import { Submission } from "../models/submission.models.js";
import { Batch } from "../models/batch.models.js";
import { Assignment } from "../models/assignment.models.js";
import { Role } from "../models/role.models.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose from "mongoose";

const createAssignment = asyncHandler(async(req, res)=> {
    const {title, description, dueDate, batch, totalMarks} = req.body;
    const { module } = req.params;

    const existingModule = await Module.findById(module);

    if(!existingModule){
        throw new ApiError(404, "Module not found!!");
    }
    if(!title?.trim() || !description?.trim()){
        throw new ApiError(400, "Title or description cannot be empty!!");
    }
    if(batch){
        const existingBatch = await Batch.findById(batch);
        if(!existingBatch){
            throw new ApiError(404, "Batch not found!!");
        }
         if(!dueDate){
        throw new ApiError(400, "Due date cannot be empty if the assignment has a batch!!");
    }
    }

    const assignment = await Assignment.create({
        title: title.trim(),
        description: description.trim(),
        module,
        createdBy: req.user._id,
        batch: batch || null,
        dueDate:batch?dueDate:null,
        totalMarks,
    })

    const responseData = await assignment.populate([
      { path: "createdBy", select: "username" },
      { path: "batch", select: "name" },
    ]);

    return res
      .status(200)
      .json(new ApiResponse(200, responseData, "Assignment created."));
});

const getAssignmentsByModule = asyncHandler(async (req, res) => {
    const { module } = req.params;
    const moduleExists = await Module.findById(module);

    if(!moduleExists){
        throw new ApiError(404, "Module not found!!");
    }

    const mentorRole = await Role.findOne({ name: "Mentor" });
    const isMentor = mentorRole && req.user.role.equals(mentorRole._id);

    const internRole = await Role.findOne({ name: "Intern" });
    const isIntern = internRole && req.user.role.equals(internRole._id);

    const filter = { module };
    if (isMentor) {
      filter.$or = [
        { batch: { $in: req.user.mentorBatches || [] } },
        { batch: null }
      ];
    } else if (isIntern) {
      filter.$or = [
        { batch: req.user.batch || null },
        { batch: null }
      ];
    }

    const assignments = await Assignment.find(filter)
        .populate("createdBy", "username")
        .populate("batch", "name");

    return res
    .status(200)
    .json(new ApiResponse(200, assignments, "Assignments fetched."));
});

const getAssignmentById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const assignment = await Assignment.findById(id)
        .populate("createdBy", "username")
        .populate("batch", "name");

    if(!assignment){
        throw new ApiError(404, "Assignment not found!!");
    }

    const mentorRole = await Role.findOne({ name: "Mentor" });
    const isMentor = mentorRole && req.user.role.equals(mentorRole._id);
    if (isMentor) {
      const hasBatch = assignment.batch
        ? req.user.mentorBatches?.some(
            (b) => b.toString() === assignment.batch._id.toString()
          )
        : true; // no batch assignments are allowed
      if (!hasBatch) {
        throw new ApiError(403, "You do not have access to this assignment.");
      }
    }

    const internRole = await Role.findOne({ name: "Intern" });
    const isIntern = internRole && req.user.role.equals(internRole._id);
    if (isIntern) {
      const isMyBatch = assignment.batch
        ? assignment.batch._id.toString() === (req.user.batch?.toString())
        : true; // no batch assignments are allowed
      if (!isMyBatch) {
        throw new ApiError(403, "You do not have access to this assignment.");
      }
    }

    return res
    .status(200)
    .json(new ApiResponse(200, assignment, "Assignment fetched."));
});

const updateAssignment = asyncHandler(async (req, res) => {
    const {title , description, dueDate, batch, totalMarks} = req.body;
    const { id } = req.params;

    const assignment = await Assignment.findById(id);

    if(!assignment){
        throw new ApiError(404, "Assignment not found!!");
    }
    
    if(title!=undefined){
        if(!title?.trim()){
         throw new ApiError(400, "Title cannot be empty!!");   
        }
        assignment.title = title.trim();
    }

     if (description != undefined) {
       if (!description?.trim()) {
         throw new ApiError(400, "Task cannot be empty!!");
       }
       assignment.description = description.trim();
    }

    if (batch !== undefined) {
        if (batch) {
            const existingBatch = await Batch.findById(batch);
            if (!existingBatch) {
                throw new ApiError(404, "Batch not found!!");
            }
            assignment.batch = batch;
            const finalDueDate = dueDate !== undefined ? dueDate : assignment.dueDate;
            if (!finalDueDate) {
                throw new ApiError(400, "Due date cannot be empty if the assignment has a batch!!");
            }
        } else {
            assignment.batch = null;
            assignment.dueDate = null;
        }
    } else if (assignment.batch) {
        if (dueDate !== undefined && !dueDate) {
            throw new ApiError(400, "Due date cannot be empty if the assignment has a batch!!");
        }
    }

    if (dueDate !== undefined) {
        assignment.dueDate = assignment.batch ? dueDate : null;
    }
    if(totalMarks > 0){
        assignment.totalMarks = totalMarks;
    }

    await assignment.save();

    const responseData = await assignment.populate([
      { path: "createdBy", select: "username" },
      { path: "batch", select: "name" },
    ]);
    return res
    .status(200)
    .json(new ApiResponse(200, responseData, "Assignment  updated."));
});

const deleteAssignment = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const assignment = await Assignment.findById(id);

    if(!assignment){
        throw new ApiError(404, "Assignment not found!!");
    }

    const deletedSubmissions = await Submission.deleteMany({assignment: id});

    await Assignment.findByIdAndDelete(assignment._id);

    return res
    .status(200)
    .json(new ApiResponse(200, null, "Assignment deleted."));
});

export {
  createAssignment,
  getAssignmentsByModule,
  getAssignmentById,
  updateAssignment,
  deleteAssignment,
};