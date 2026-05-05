import mongoose from "mongoose";

const dataschema = new mongoose.Schema(
    {
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user",
            required: true
        },
        email: {
            type: String,
            required: true,
            unique: true
        },
        media: [
            {
                url: {
                    type: String
                    // required: true
                },
                type: {
                    type: String
                    // required: true
                },
                public_id: {
                    type: String
                    // required: true
                }
            }
        ]
    }, { timestamps: true }
)
const data = mongoose.model("data", dataschema);
export default data;