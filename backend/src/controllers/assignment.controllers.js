import { Module } from "../models/module.models.js";
import { Submission } from "../models/submission.models.js";
import { Assignment } from "../models/assignment.models.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose from "mongoose";

const createAssignment = asyncHandler(async(req, res)=> {
    const {title, description, dueDate, totalMarks} = req.body;
    const { module } = req.params;

    const existingModule = await Module.findById(module);

    if(!existingModule){
        throw new ApiError(404, "Module not found!!");
    }
    if(!title?.trim() || !description?.trim()){
        throw new ApiError(400, "Title or description cannot be empty!!");
    }

    if(!dueDate){
        throw new ApiError(400, "Due date cannot be empty!!");
    }

    const assignment = await Assignment.create({
        title: title.trim(),
        description: description.trim(),
        module,
        createdBy: req.user._id,
        dueDate,
        totalMarks
    })

    return res
    .status(200)
    .json(new ApiResponse(200, assignment, "Assignment created."));
});

const getAssignmentsByModule = asyncHandler(async (req, res) => {
    const { module } = req.params;
    const moduleExists = await Module.findById(module);

    if(!moduleExists){
        throw new ApiError(404, "Module not found!!");
    }

    const assignments = await Assignment.find({module});

    return res
    .status(200)
    .json(new ApiResponse(200, assignments, "Assignments fetched."));
});

const getAssignmentById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const assignment = await Assignment.findById(id);

    if(!assignment){
        throw new ApiError(404, "Assignment not found!!");
    }

    return res
    .status(200)
    .json(new ApiResponse(200, assignment, "Assignment fetched."));
});

const updateAssignment = asyncHandler(async (req, res) => {
    const {title , description, dueDate, totalMarks} = req.body;
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

    if(dueDate!=undefined){
        assignment.dueDate = dueDate;
    }

    if(totalMarks > 0){
        assignment.totalMarks = totalMarks;
    }

    await assignment.save();

    return res
    .status(200)
    .json(new ApiResponse(200, assignment, "Assignment  updated."));
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