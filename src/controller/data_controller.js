import data from "../model/data.js";
import path from 'path'
import fs from 'fs'
// import { v2 as cloudinary } from "cloudinary";
import cloudinary from "../config/cloudinary.js"

// ******************** Media Add ********************

export const data_create = async (req, res) => {
    // const { user_id, email } = req.body;

    try {
        const user_id = req.user.id;
        const email = req.user.email;

        const doc = await data.findOne({ user_id });
        if (!doc || doc.email !== email) {
            return res.status(400).json({ message: "id/email not match" });
        }

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: "No media files uploaded" });
        }

        const mediaarray = [];

        for (let i = 0; i < req.files.length; i++) {
            const file = req.files[i];
            // const result = await cloudinary.uploader.upload(
            //     `data:${file.mimetype};base64,${file.buffer.toString("base64")}`,
            //     { resource_type: "auto" }
            // );
            const result = await cloudinary.uploader.upload(
                `data:${file.mimetype};base64,${file.buffer.toString("base64")}`,
                {
                    folder: "vault/media",
                    resource_type: "auto"
                }
            );
            mediaarray.push({
                url: result.secure_url,
                type: result.resource_type,
                public_id: result.public_id
            });
        }

        await data.updateOne(
            { user_id },
            { $push: { media: { $each: mediaarray } } }
        );

        const updatedDoc = await data.findOne({ user_id });

        res.status(201).json({
            message: "Media uploaded successfully",
            data: updatedDoc
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Something went wrong",
            error: error.message
        });
    }
};



// ******************** data read ********************
export const data_read = async (req, res) => {
    const user_id = req.user.id;
    const email = req.user.email;

    try {
        const doc = await data.findOne({ user_id: user_id })
        if (!doc) {
            return res.status(404).json({
                message: "User Not Found"
            })
        }

        // const read = await data.find()
        // return res.status(200).json({
        //     message: "Data Fetch Successful",
        //     data: read
        // })

        return res.status(200).json({
            message: "Data Fetch Successful",
            data: doc.media
        });

    } catch (error) {
        return res.status(500).json({
            message: "Something Went Wrong",
            error: error.message
        })
    }
}

// ******************** data Delete ********************
export const data_delete = async (req, res) => {
    const user_id = req.user.id;
    const mediaId = req.params.id;

    try {
        const doc = await data.findOne({ user_id })
        if (!doc) {
            return res.status(404).json({ message: "Data Not Found" })
        }

        const media_item = doc.media.id(mediaId)
        if (!media_item) {
            return res.status(404).json({ message: "Media Not Found" })
        }

        // ✅ yahan fix
        await cloudinary.uploader.destroy(media_item.public_id, {
            // resource_type: "auto"
            resource_type: media_item.resource_type
        })

        // await media_item.remove()
        doc.media.pull({ _id: mediaId })
        await doc.save()

        return res.status(200).json({
            message: "Media Delete Successful"
        })

    } catch (error) {
        console.log("ERROR 👉", error)
        return res.status(500).json({
            message: "Backend error Something Went Wrong",
            error: error.message
        })
    }
}


// export const data_delete = async (req, res) => {
//     const user_id = req.user.id;
//     const mediaId = req.params.mediaId;
//         const doc = await data.findOne({ user_id })
//     try {
//         if (!doc) {
//             return res.status(404).json({
//                 message: "Data Not Found"
//             })
//         }
//         const media_item = await doc.media.id(mediaId)
//         if (!media_item) {
//             return res.status(404).json({
//                 message: "Media Not Found"
//             })
//         }
//         await cloudinary.uploader.destroy(mediaId.public_id, {
//             resource_type: "auto"
//         });
//         await media_item.remove()
//         await doc.save()
//         return res.status(200).json({
//             message: "Media Delete Successful"
//         })
//     } catch (error) {
//         return res.status(500).json({
//             message: "Something Went Wrong",
//             error: error.message
//         })
//     }
// }

// const data_delete = async (req, res) => {
//     const user_id = req.user.id;
//     const mediaId = req.params.mediaId;
//     try {
//         const doc = await data.findOne({ user_id })
//         if (!doc) {
//             return res.status(404).json({
//                 message: "Data Not Found"
//             })
//         }
//         const media_item = doc.media.id(mediaId);
//         if (!media_item) {
//             return res.status(404).json({
//                 message: "Media Not Found"
//             })
//         }
//         await cloudinary.uploader.destroy(media_item.public_id, {
//             resource_type: "auto"
//         })
//         media_item.remove();
//         await doc.save()

//         res.status(200).json({
//             message: "Media deleted successfully"
//         });
//     } catch (error) {
//         return res.status(500).json({
//             message: "Something Went Wrong",
//             error: error.message
//         })
//     }
// }

// ******************** data Update Remove media ********************
export const data_delete_media = async (req, res) => {
    const { name, email, media_id, url } = req.body;
    try {
        const doc = await data.findOne({ email: email })
        if (!doc) {
            return res.status(404).json({
                "message": "User Not Found"
            })
        }

        // 1️⃣ File ka full path banao
        const filePath = path.join(process.cwd(), url);

        // 2️⃣ Folder se file delete
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        // remove array value
        await data.updateOne(
            { email: email },
            { $pull: { media: { url: url } } }
        )

        // update
        // await data.updateOne(
        //     { email: email, "media._id": media_id },
        //     { $set: { "media.$.url": url } },
        //     { new: true }
        // )

        // add array 
        // await data.updateOne(
        //     { email: email },
        //     {
        //         $push:
        //         {
        //             media: { url: url } 
        //         }
        //     }
        // )

        const updatedDoc = await data.findOne({ email: email });
        return res.status(200).json({
            message: "Media Deleted Successfully",
            data: updatedDoc
        });

    } catch (error) {
        return res.status(500).json({
            message: "Something Went Wrong",
            error: error.message
        });
    }

}