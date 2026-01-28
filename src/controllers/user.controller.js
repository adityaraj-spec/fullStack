import { json } from "express";
import {asyncHandler} from "../utils/asyncHandler.js";
import ApiError from "../utils/apiError.js"
import { User } from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"

const registerUser = asyncHandler( async(req, res) => {
    // get user details from frontend(postman)
    // validation(koi field empty to nahi bhej diya user ne, format correct hai na  )
    // check if user already exists: username, email
    // check for images , check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation 
    // return response

    const {fullName, username, email, password} = req.body;
    console.log("email:", email);

    if  (
        [fullName, username, email, password].some((field) => {
            field?.trim() === ""
        })
        )
    {
        throw new ApiError (400 , "All fields are required")
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })
    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;
    let coverImageLocalPath; // dono hi same tarika hai file path save karne ka 
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalPath = req.files.coverImage[0].path;
    }
    if( !avatarLocalPath ){
        throw new ApiError(400, "Avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    if(! avatar ){
        throw new ApiError(400, "Avatar file is required")
    }

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select("-password -refreshToken") // (-) ka matlb hai nahi cahiye wo chiz hume user milne ke bad
    if(!createdUser) {
        throw new ApiError(505, "Something went wrong registering the user ")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
    )

})


export{ registerUser }