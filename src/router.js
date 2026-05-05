import express from 'express';
import { signup, signin, verify, aganverify, user_update } from './controller/user_controller.js';
import { data_create, data_read, data_delete, data_delete_media } from './controller/data_controller.js';
import upload from './middlewere/multer.js';
import authMiddleware from './middlewere/auth.js';

const router = express.Router()

// router.get("/", (req, res) => {
//     res.send("Hellow World")
// })

// http://localhost:2000/signup

router.post("/signup", signup)
router.post("/", signin)
router.patch("/verify", verify) 
router.post("/aganverify", aganverify)
router.patch("/update", authMiddleware, user_update)

// router.post("/datacreate", data_create)
router.post("/datacreate", authMiddleware, upload.array("media", 10), data_create)
router.get("/dataread", authMiddleware, data_read)
router.patch("/datadeletemedia", data_delete_media)
router.delete("/datadelete/:id", authMiddleware, data_delete)

export default router;