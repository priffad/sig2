const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
    cloud_name: 'dijf4rpwv',
    api_key: '325353924959639',
    api_secret: 'nodzRD2PwgBkBzSN-80og4h4eKo',
});

function getCloudinaryStorage(folderName) {
    return new CloudinaryStorage({
        cloudinary: cloudinary,
        params: {
            folder: folderName,
            allowedFormats: ['jpg', 'png', 'jpeg'],
        },
    });
}

module.exports = { cloudinary, getCloudinaryStorage };
