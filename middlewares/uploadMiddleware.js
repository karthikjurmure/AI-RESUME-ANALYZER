const multer = require("multer");
const path = require("path");
const jwt=require("jsonwebtoken");
const storage = multer.diskStorage({
    destination: function(req, file, cb){
        cb(null, "uploads/");
    },
    filename: function(req, file, cb){
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: function(req, file, cb) {
        // Accept multiple PDF MIME types since different systems might send different ones
        const allowedMimes = ['application/pdf', 'application/x-pdf', 'application/x-portable-document-format'];
        const fileExt = path.extname(file.originalname).toLowerCase();
        
        if (allowedMimes.includes(file.mimetype) || fileExt === '.pdf') {
            cb(null, true);
        } else {
            console.log(`Rejected file: ${file.originalname}, MIME: ${file.mimetype}, Ext: ${fileExt}`);
            cb(new Error("Only PDF files are allowed"), false);
        }
    }
});

const authMiddleware=(req,res,next)=>{
    const header=req.headers.authorization;
    if(!header){
        return res.status(401).json({
            message:"Authorization header missing"
        })
    }
    const token=header.split(" ")[1];
    try{
        const decoded=jwt.verify(token,process.env.JWT_SECRET);
        req.user=decoded;
        next();
    }
    catch(error){
        res.status(401).json({
            message:"Invalid or expired token"
        })
    }
}

module.exports = { upload, authMiddleware };
module.exports.authMiddleware = authMiddleware;
