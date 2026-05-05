import mongoose from "mongoose";

const userschema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true
        },
        password: {
            type: String,
            required: true
        },
        isverified: {
            type: Boolean,
            default: false
        },
        otp: {
            type: String
        },
        otpexpire: {
            type: Date
        },
        otpsentat: {
            type: Date
        }
    }, { timestamps: true }
);

const user = mongoose.model("user", userschema);

export default user;