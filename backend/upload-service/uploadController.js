import multer from "multer";
import { uploadToGCS } from "./utils/gcsFileUploader.js";

// Configure multer for memory storage
export const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB limit
    }
  });

 export const uploadController = [
  upload.single('files'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).send({ message: 'No file uploaded.' });
      }

      // Use the helper function to upload to GCS
      const publicUrl = await uploadToGCS(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );

      // Return success response with the file URL
      res.status(200).send({ 
        message: 'Upload successful',
        url: publicUrl 
      });

    } catch (err) {
      console.error('Upload error:', err);
      res.status(500).send({ 
        message: 'Server error', 
        error: err.message 
      });
    }
  }
];
