import multer from "multer";
import path from "path";
import fs from "fs";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";

// ─── Cloudinary Configuration ───
// If credentials are present, use Cloudinary CDN for permanent, optimized image hosting.
// Otherwise, fall back to local disk storage (for development without credentials).
const useCloudinary = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (useCloudinary) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  console.log("☁️  Cloudinary CDN active for image uploads");
}

// ─── Cloudinary Storage ───
const cloudinaryStorage = useCloudinary
  ? new CloudinaryStorage({
      cloudinary,
      params: {
        folder: "rythu-sethu",
        allowed_formats: ["jpg", "jpeg", "png", "gif", "webp", "mp4", "mov"],
        transformation: [
          { width: 1200, height: 1200, crop: "limit", quality: "auto:good", fetch_format: "auto" }
        ],
        resource_type: "auto",
      },
    })
  : null;

// ─── Local Disk Storage (Fallback) ───
const uploadDir = "public/uploads/";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const diskStorage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, "public/uploads/");
  },
  filename(req, file, cb) {
    cb(
      null,
      `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`
    );
  },
});

// ─── File Type Filter ───
function checkFileType(file, cb) {
  if (file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/")) {
    return cb(null, true);
  } else {
    cb(new Error("Images and Videos only!"));
  }
}

// ─── Export Upload Middleware ───
const upload = multer({
  storage: useCloudinary ? cloudinaryStorage : diskStorage,
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
});

// Export cloudinary instance for use in other modules if needed
export { cloudinary, useCloudinary };
export default upload;
