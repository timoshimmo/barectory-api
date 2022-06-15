require("dotenv").config();
const cloudinary = require("cloudinary");

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME || 'westpaybankit',
  api_key: process.env.API_KEY || '373369321696875',
  api_secret: process.env.API_SECRET || 'p6dAF1riJS3TMd5HJg-PgtP0pRA',
  secure: true
});
exports.uploads = (file, folder) => {
  return new Promise((resolve) => {
    cloudinary.uploader.upload(
      file,
      (result) => {
        resolve({ url: result.url, id: result.public_id });
      },
      {
        resource_type: "auto",
        folder: folder
      }
    );
  });
};
