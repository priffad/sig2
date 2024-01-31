
const AWS = require('aws-sdk');

AWS.config.update({
    accessKeyId: process.env.MY_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.MY_AWS_SECRET_ACCESS_KEY,
    region: process.env.MY_AWS_REGION
});

const s3 = new AWS.S3();

async function uploadImageToS3(buffer, mimetype) {
    const uploadParams = {
        Bucket: process.env.MY_AWS_BUCKET_NAME,
        Key: `images/${Date.now()}`,
        Body: buffer,
        ContentType: mimetype,
    };

    try {
        const uploadResult = await s3.upload(uploadParams).promise();
        return uploadResult.Location;
    } catch (error) {
        console.error("Error uploading to S3: ", error);
        throw error;
    }
}

module.exports = { uploadImageToS3 };
