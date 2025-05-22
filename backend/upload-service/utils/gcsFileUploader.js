const { Storage } = require('@google-cloud/storage');
require('dotenv').config();

// Initialize Storage
const storage = new Storage({
  projectId: process.env.GCS_PROJECT_ID,
  keyFilename: process.env.GCS_KEY_FILE_PATH
});

const bucket = storage.bucket(process.env.GCS_BUCKET);

/**
 * Uploads a file to Google Cloud Storage
 * @param {Buffer} fileBuffer - The file buffer to upload
 * @param {string} originalName - Original file name
 * @param {string} mimeType - File's MIME type
 * @returns {Promise<string>} - Public URL of the uploaded file
 */
const uploadToGCS = (fileBuffer, originalName, mimeType) => {
  return new Promise((resolve, reject) => {
    // Create a unique file name
    const fileName = `${Date.now()}-${originalName}`;
    
    // Create a reference to the file in GCS
    const file = bucket.file(fileName);
    
    // Create a write stream
    const stream = file.createWriteStream({
      metadata: {
        contentType: mimeType,
      },
      resumable: false,
    });

    // Handle errors during upload
    stream.on('error', (err) => {
      reject(err);
    });

    // Handle successful upload
    stream.on('finish', async () => {
      try {
        // // Make the file publicly accessible
        // await file.makePublic();
        
        // Return the public URL
        const publicUrl = `https://storage.googleapis.com/${process.env.GCS_BUCKET}/${fileName}`;
        resolve(publicUrl);
      } catch (err) {
        reject(err);
      }
    });

    // Write the file buffer to the stream
    stream.end(fileBuffer);
  });
};

module.exports = {
  uploadToGCS
};