import { College } from "../models/college.models.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const createCollege = asyncHandler(async(req,res)=>{
    const {name} = req.body;
    if(!name?.trim()){
        throw new ApiError(400,"College name cannot be empty!!");
    }
    const existingCollege = await College.findOne({name:name.trim()});
    if(existingCollege){
        throw new ApiError(409,"College with this name already exists!!");
    }
    const college = await College.create({
        name:name.trim()
    });
    return res.status(201).json(new ApiResponse(201,college,"College created successfully."));
});

const updateCollege = asyncHandler(async(req,res)=>{
    const {id} = req.params;
    const {name} = req.body;
    const college = await College.findById(id);
    if(!college){
        throw new ApiError(404,"College not found!!");
    }
    if(name){
        if(!name.trim()){
            throw new ApiError(400,"College name cannot be empty!!");
        }
        const existingCollege = await College.findOne({name:name.trim(),_id:{$ne:id}});
        if(existingCollege){
            throw new ApiError(409,"College with this name already exists!!");
        }
        college.name = name.trim();
    }
    await college.save();
    const updatedCollege = await College.findById(college._id);
    return res.status(200).json(new ApiResponse(200,updatedCollege,"College updated successfully."));
});

const deleteCollege = asyncHandler(async(req,res)=>{
    const {id} = req.params;
    const college = await College.findById(id);
    if(!college){
        throw new ApiError(404,"College not found!!");
    }
    await College.findByIdAndDelete(id);
    return res.status(200).json(new ApiResponse(200,{},"College deleted successfully."));
});

const getAllColleges = asyncHandler(async(req,res)=>{
    const colleges = await College.aggregate([
        {
            $lookup:{
                from:"users",
                localField:"_id",
                foreignField:"college",
                as:"interns"
            }
        },
        {
            $addFields:{
                internCount:{$size:"$interns"}
            }
        },
        {
            $project:{
                _id:1,
                name:1,
                internCount:1
            }
        }
    ])
    return res.status(200).json(new ApiResponse(200,colleges,"Colleges fetched successfully."));
});

const getCollegeById = asyncHandler(async(req,res)=>{
    const {id} = req.params;
    const college = await College.findById(id);
    if(!college){
        throw new ApiError(404,"College not found!!");
    }
    return res.status(200).json(new ApiResponse(200,college,"College fetched successfully."));
});

export {createCollege,updateCollege,deleteCollege,getAllColleges,getCollegeById};