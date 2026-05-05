import mongoose from "mongoose";
import user from "../model/user.js";
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import sendOtpMail from "../utils/sendmail.js";
import data from "../model/data.js";

export const signup = async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const exist_user = await user.findOne({ email: email })
        if (exist_user) {
            return res.status(400).json({
                message: "User Already Exist"
            })
        }
        const hashedPassword = await bcrypt.hash(password, 10)
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        await sendOtpMail(email, otp)
        const new_user = await user.create({
            name,
            email,
            password: hashedPassword,
            otp,
            otpexpire: Date.now() + 5 * 60 * 1000,
            isverified: false,
            otpsentat: new Date()
        })
        const new_data = await data.create({
            user_id: new_user._id,
            email
        })
        // const token = jwt.sign(
        //     { id: new_user._id, email: new_user.email },
        //     process.env.JWT_SECRET,
        //     { expiresIn: "7d" }
        // )
        return res.status(201).json({
            message: "User Signup Successful",
            user: {
                name: new_user.name,
                email: new_user.email
            }
            // token: token
        })
    } catch (error) {
        return res.status(500).json({
            message: "Something Went Wrong",
            error: error.message
        })
    }
}

export const verify = async (req, res) => {
    const { email, otp } = req.body
    try {
        const doc = await user.findOne({ email })
        if (!doc) {
            return res.status(404).json({
                message: "User Not Found"
            })
        }
        if (doc.isverified === true) {
            return res.status(400).json({
                message: "User Already Verify"
            })
        }
        if (doc.otpexpire < Date.now()) {
            return res.status(400).json({
                message: "OTP Expired"
            })
        }
        if (doc.otp !== otp.toString()) {
            return res.status(400).json({
                message: "Wrong OTP"
            })
        }
        doc.isverified = true;
        doc.otp = undefined;
        doc.otpexpire = undefined;
        await doc.save();

        const token = jwt.sign(
            {
                id: doc._id,
                name: doc.name,
                email: doc.email
            },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        )
        return res.status(200).json({
            message: "Account Verified Successfully",
            token: token,
            user: {
                id: doc._id,
                name: doc.name,
                email: doc.email,
                isverified: doc.isverified
            }
        });
    } catch (error) {
        return res.status(500).json({
            message: "Something Went Wrong",
            error: error.message
        })
    }
}

export const aganverify = async (req, res) => {
    const { email } = req.body;
    try {
        const doc = await user.findOne({ email })
        if (!doc) {
            return res.status(404).json({
                message: "User Not Found"
            })
        }
        if (doc.isverified === true) {
            return res.status(400).json({
                message: "User Already Verify"
            })
        }
        if (doc.otpsentat && Date.now() - doc.otpsentat < 2 * 60 * 1000) {
            const waitTime = Math.ceil(
                (2 * 60 * 1000 - (Date.now() - doc.otpsentat)) / 1000
            );
            return res.status(400).json({
                message: `Please wait ${waitTime} seconds before resending OTP`
            });
        }
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        doc.otp = otp
        doc.otpexpire = Date.now() + 5 * 60 * 1000;
        // doc.otpsentat = Date.now()
        doc.otpsentat = new Date();
        await doc.save();
        await sendOtpMail(email, otp)
        return res.status(200).json({
            message: "OTP Sent Again"
        });
    } catch (error) {
        return res.status(500).json({
            message: "Something Went Wrong",
            error: error.message
        })
    }
}

export const signin = async (req, res) => {
    const { email, password } = req.body;
    try {
        const exist_user = await user.findOne({ email: email })
        if (!exist_user) {
            return res.status(401).json({
                // message: "User Not Exist"
                message: "Invalid Email or Password"
            })
        }
        const isMatch = await bcrypt.compare(password, exist_user.password)
        if (!isMatch) {
            return res.status(401).json({
                message: "Invalid Email Or Password"
            })
        }
        const token = jwt.sign({
            id: exist_user._id,
            name: exist_user.name,
            email: exist_user.email
        },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        )
        return res.status(200).json({
            message: "Signin Successful",
            token,
            user: {
                id: exist_user._id,
                name: exist_user.name,
                email: exist_user.email,
                isverified: exist_user.isverified
            }
        })

    } catch (error) {
        return res.status(500).json({
            message: "Signin Field",
            error
        })
    }
}

export const user_update = async (req, res) => {
    const email = req.user.email;
    const name = req.body.name;
    const password = req.body.password;
    const current_password = req.body.current_password

    try {
        const doc = await user.findOne({ email: email })
        if (!doc) {
            return res.status(404).json({
                message: "User Not Found"
            })
        }

        if (!name && !password) {
            return res.status(400).json({
                message: "Please update either name or password"
            })
        }

        if (name) {
            await user.updateOne(
                { email },
                { $set: { name: name } }
            )
            const new_user = {
                id: doc._id,
                name: name,
                email: doc.email
            }
            const new_token = jwt.sign({
                id: doc._id,
                name: name,
                email: doc.email
            },
                process.env.JWT_SECRET,
                { expiresIn: "1d" }
            )
            return res.status(200).json({
                message: "Name Update Successful",
                token: new_token,
                user: new_user
            });
        }

        if (password) {
            const ismatch = await bcrypt.compare(current_password, doc.password)
            if (ismatch) {
                const hashedPassword = await bcrypt.hash(password, 10);
                await user.updateOne(
                    { email },
                    { $set: { password: hashedPassword } }
                );
                const new_user = {
                    id: doc._id,
                    // name: name ? 
                    name: doc.name,
                    email: doc.email
                }
                const new_token = jwt.sign({
                    id: doc._id,
                    name: doc.name,
                    email: doc.email
                },
                    process.env.JWT_SECRET,
                    { expiresIn: "1d" }
                )
                return res.status(200).json({
                    message: "Password Update Successful",
                    token: new_token,
                    user: new_user
                });
            }
            return res.status(400).json({
                message: "Password Incrent"
            })
        }

        const new_token = jwt.sign({
            id: doc._id,
            name: doc.name,
            email: doc.email
        },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        )

        return res.status(400).json({
            message: "Nothing to update",
            token: new_token,
            user: {
                id: doc._id,
                name: name,
                email: doc.email,
            }
        });
    } catch (error) {
        res.status(500).json({
            message: "Something Went Wrong"
        })
    }
}

const delete_user = async (req, res) => {
    const email = req.user.email;
    const password = req.body.password;
    try {
        if (!password) {
            return res.status(500).json({
                message: "Password ?"
            })
        }

        const match_user = await user.findOne({ email })
        const matct_data = await data.findOne({ email })

        const match = await bcrypt.compare(password, match_user.password)

        if (!match) {
            return res.status(400).json({
                message: "Password Wrong"
            })
        }

        if (!match_user && !matct_data) {
            return res.status(500).json({
                message: "user or data not match"
            })
        }

        for (let item of matct_data.medai) {
            await cloudinary.uploader.destroy(item.public_id)
        }

    } catch (error) {
        res.status(500).json({
            message: "Something Went Wrong"
        })
    }
}