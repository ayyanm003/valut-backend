import jwt from "jsonwebtoken"
import dotenv from "dotenv"

dotenv.config();

const authMiddleware = (req, res, next) => {
    try {
        const authheader = req.headers.authorization;
        // console.log("Authorization Header:", req.headers.authorization);

        if (!authheader) {
            return res.status(401).json({
                message: "No token provided"
            })
        }
        const token = authheader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        req.user = decoded;
        next()
    } catch (error) {
        // console.log("JWT Error:", error.message);

        return res.status(401).json({
            message: error.message
        });
    }
}
export default authMiddleware;  