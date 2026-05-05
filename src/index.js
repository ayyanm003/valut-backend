import express from 'express';
import router from './router.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv'
import cors from 'cors'
dotenv.config();

const port = process.env.port

const app = express()

// app.use(cors({
//     origin: "http://localhost:3000"
// }));
app.use(cors())

// app.use(express.json())
app.use(express.json({ strict: false }));

app.use("/", router)

// app.get("/", (req, res) => {
//     res.send("Hellow World")
// })

// mongoose.connect(process.env.MONGO_URL)
//     .then(() => {
//         app.listen(port, () => {
//             console.log("Server Start")
//         })
//     })
//     .catch((error) => {
//         console.log("DB Not Connect", error)
//     })

mongoose.connect(process.env.MONGO_URL)
    .then(() => {
        console.log("MongoDB Connected");
    })
    .catch((error) => {
        console.log("DB Not Connect", error);
    });

export default app;

// app.listen(2000, () => {
//     console.log("Server Start")
// })