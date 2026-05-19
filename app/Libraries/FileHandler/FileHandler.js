'use strict'
const { v4: uuidv4 } = require('uuid');
const _ = require('lodash');
const fs = require('fs');
const constants = require('../../config/constants');
let sharp;
try {
    sharp = require('sharp');
} catch (e) {
    console.warn('sharp library not installed. Image blur functionality will not work. Install with: npm install sharp');
}

class FileHandler {

    static async doUpload(fileObject, destination_upload_path = 'uploads/', resize = true) {
        const supportDrivers = ['local', 's3'];
        if (supportDrivers.indexOf(constants.FILE_SYSTEM) === -1) {
            throw new Error('File upload driver "' + (constants.FILE_SYSTEM || '') + '" is not supported. Use: ' + supportDrivers.join(', '));
        }
        if (constants.FILE_SYSTEM == 'local') {
            return await this.uploadFileInLocal(fileObject, destination_upload_path, resize);
        } else {
            return await this.uploadFileInS3(fileObject, destination_upload_path, resize);
        }
    }

    /**
     * Upload file(s) to AWS S3.
     * Returns same path format as local: "path/filename" (single) or array of paths (multiple).
     * Requires env: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET; optional: AWS_REGION, S3_PUBLIC_URL.
     */
    static async uploadFileInS3(fileObject, destination_upload_path, resize = true) {
        const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
        const bucket = constants.AWS_S3_BUCKET;
        const region = constants.AWS_REGION;
        if (!bucket || !constants.AWS_ACCESS_KEY_ID || !constants.AWS_SECRET_ACCESS_KEY) {
            throw new Error('S3 upload requires AWS_S3_BUCKET, AWS_ACCESS_KEY_ID, and AWS_SECRET_ACCESS_KEY in env.');
        }
        // console.log(constants.AWS_ACCESS_KEY_ID, constants.AWS_SECRET_ACCESS_KEY, constants.AWS_REGION, constants.AWS_S3_BUCKET, constants.S3_PUBLIC_URL);
        const s3 = new S3Client({
            region,
            credentials: {
                accessKeyId: constants.AWS_ACCESS_KEY_ID,
                secretAccessKey: constants.AWS_SECRET_ACCESS_KEY,
            },
        });

        const uploadOne = async (file) => {
            const subtype = file.mimetype ? file.mimetype.split('/') : ['', 'bin'];
            const ext = subtype[subtype.length - 1] || 'bin';
            const filename = `${uuidv4()}.${ext}`;
            const key = `${destination_upload_path}/${filename}`.replace(/\/+/g, '/');
            let body = file.buffer;
            let contentType = file.mimetype || 'application/octet-stream';
            if (resize && sharp && this.isImageFile(file)) {
                try {
                    const resized = await sharp(file.buffer)
                        .resize(1920, 1920, { fit: 'inside', withoutEnlargement: true })
                        .toBuffer();
                    body = resized;
                } catch (e) {
                    // keep original buffer if resize fails
                }
            }
            await s3.send(new PutObjectCommand({
                Bucket: bucket,
                Key: key,
                Body: body,
                ContentType: contentType,
            }));
            return `${destination_upload_path}/${filename}`;
        };

        if (!Array.isArray(fileObject)) {
            return await uploadOne(fileObject);
        }
        const file_data = [];
        for (let i = 0; i < fileObject.length; i++) {
            file_data.push(await uploadOne(fileObject[i]));
        }
        return file_data;
    }

    static async uploadFileInLocal(fileObject, destination_upload_path, resize) {
        const original_destination_upload_path = "uploads/" + destination_upload_path+"/";
        if (!fs.existsSync(original_destination_upload_path)) {
            fs.mkdirSync(original_destination_upload_path, { recursive: true });
        }
        if (!Array.isArray(fileObject)) {
            const subtype = fileObject.mimetype.split('/')
            let filename = `${uuidv4()}.${subtype[subtype.length - 1]}`;
            fs.writeFileSync(original_destination_upload_path + filename, fileObject.buffer);

            return destination_upload_path+"/"+filename;
        } else {
            //multiple file upload
            let file_data = [];
            let files = fileObject;
            for (var i = 0; i < files.length; i++) {
                const subtype = files[i].mimetype.split('/')
                let filename = `${uuidv4()}.${subtype[subtype.length - 1]}`;
                fs.writeFileSync(original_destination_upload_path + filename, files[i].buffer);

                file_data.push(destination_upload_path+"/"+filename);
            }
            return file_data;
        }


    }

    static async makeDirectory(dir = '') {
        if (!dir) return;
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    }

    /**
     * Check if file is an image
     * @param {object} file - File object with mimetype
     * @returns {boolean}
     */
    static isImageFile(file) {
        if (!file || !file.mimetype) return false;
        return file.mimetype.startsWith('image/');
    }

    /**
     * Create a blurred version of an image
     * @param {Buffer} imageBuffer - Image buffer
     * @param {number} blurAmount - Blur amount (default: 10)
     * @returns {Promise<Buffer>} Blurred image buffer
     */
    static async blurImage(imageBuffer, blurAmount = 10) {
        if (!sharp) {
            throw new Error('sharp library is not installed. Please install it with: npm install sharp');
        }
        try {
            const blurredBuffer = await sharp(imageBuffer)
                .blur(blurAmount)
                .toBuffer();
            return blurredBuffer;
        } catch (error) {
            console.error('Error blurring image:', error);
            throw new Error('Failed to blur image: ' + error.message);
        }
    }

    /**
     * Upload file and optionally create blurred version for images
     * @param {object|array} fileObject - File object(s) to upload
     * @param {string} destination_upload_path - Destination path
     * @param {boolean} createBlur - Whether to create blurred version
     * @param {number} blurAmount - Blur amount (default: 10)
     * @returns {Promise<object|array>} Upload result with original and blurred URLs
     */
    static async doUploadWithBlur(fileObject, destination_upload_path = 'uploads/', createBlur = false, blurAmount = 10) {
        const original_destination_upload_path = "uploads/" + destination_upload_path + "/";
        if (!fs.existsSync(original_destination_upload_path)) {
            fs.mkdirSync(original_destination_upload_path, { recursive: true });
        }

        if (!Array.isArray(fileObject)) {
            // Single file upload
            const subtype = fileObject.mimetype.split('/');
            let filename = `${uuidv4()}.${subtype[subtype.length - 1]}`;
            const filePath = original_destination_upload_path + filename;
            fs.writeFileSync(filePath, fileObject.buffer);

            const result = {
                original_url: destination_upload_path + "/" + filename
            };

            // Create blurred version if requested and file is an image
            if (createBlur && this.isImageFile(fileObject)) {
                try {
                    const blurredBuffer = await this.blurImage(fileObject.buffer, blurAmount);
                    const blurredFilename = `blur_${filename}`;
                    const blurredFilePath = original_destination_upload_path + blurredFilename;
                    fs.writeFileSync(blurredFilePath, blurredBuffer);
                    result.blured_image_url = destination_upload_path + "/" + blurredFilename;
                } catch (error) {
                    console.error('Failed to create blurred image:', error);
                    // Continue without blurred image if blur fails
                }
            }

            return result;
        } else {
            // Multiple file upload
            let file_data = [];
            let files = fileObject;
            for (var i = 0; i < files.length; i++) {
                const subtype = files[i].mimetype.split('/');
                let filename = `${uuidv4()}.${subtype[subtype.length - 1]}`;
                const filePath = original_destination_upload_path + filename;
                fs.writeFileSync(filePath, files[i].buffer);

                const fileResult = {
                    original_url: destination_upload_path + "/" + filename
                };

                // Create blurred version if requested and file is an image
                if (createBlur && this.isImageFile(files[i])) {
                    try {
                        const blurredBuffer = await this.blurImage(files[i].buffer, blurAmount);
                        const blurredFilename = `blur_${filename}`;
                        const blurredFilePath = original_destination_upload_path + blurredFilename;
                        fs.writeFileSync(blurredFilePath, blurredBuffer);
                        fileResult.blured_image_url = destination_upload_path + "/" + blurredFilename;
                    } catch (error) {
                        console.error('Failed to create blurred image:', error);
                        // Continue without blurred image if blur fails
                    }
                }

                file_data.push(fileResult);
            }
            return file_data;
        }
    }
}
module.exports = FileHandler
