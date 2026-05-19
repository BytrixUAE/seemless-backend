const Validator = require('validatorjs');
const bcrypt = require("bcrypt")
const config = require("../config/constants");
const { UPLOAD_DIRECTORY, UPLOAD_DIRECTORY_MAPPING } = require('../config/enum');

const baseUrl = () => {
    return config.BASE_URL || "http://localhost:3000"
}

/** Base URL for file/image paths: S3 when FILE_SYSTEM=s3, else app BASE_URL. Use for building image_url. */
const getFileBaseUrl = () => {
    if (config.FILE_SYSTEM === 's3' && config.S3_PUBLIC_URL) {
        const url = config.S3_PUBLIC_URL.trim();
        return url.endsWith('/') ? url : url + '/';
    }
    return baseUrl();
}


const getUserDirectory = () => {
    return 'uploads/' + UPLOAD_DIRECTORY.USER + '/';
}
const getUploadDirectoryPath = (module) => {
    return 'uploads/' + module + '/';
}
const isJSON = (str) => {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}


const extractFields = (obj, fields) => {
    const result = {};
    for (const field of fields) {
        if (field in obj) {
            result[field] = obj[field];
        }
    }
    return result;
}

const validateAll = async (body, rules, customMessages) => {
    const validation = new Validator(body, rules, customMessages);
    return validation
};
const validateAsync = async (body, rules, customMessages) => {

    try {

        const validation = new Validator(body, rules, customMessages);
        let passes = () => { };
        let fails = () => { };

        const promise = new Promise((resolve) => {
            passes = () => { resolve(true); };
            fails = () => { resolve(false); };
        });

        validation.checkAsync(passes, fails);

        const result = await promise;

        if (result === false) {
            const message = validation.errors.all();
            throw message
        }


        validation.fails = () => false;
        return validation
    }
    catch (err) {

        let obj = {
            errors: {
                errors: err
            },
            fails: () => true
        };

        return obj
    }



}

const generateHash = (text) => {
    console.log("Generating hash : ", text)
    return bcrypt.hashSync(text, config.PASSWORD_SALT_ROUND);

}

const generateOTP = (length = 6) => {
    return `${Math.floor(10 ** (length - 1) + Math.random() * 9 * 10 ** (length - 1))}`
}

const compareHash = (password, hash) => {
    console.log(bcrypt.compareSync(password, hash))
    return bcrypt.compareSync(password, hash);
}


const getImageUrl = (image_url, type) => {
    const fileBase = getFileBaseUrl();
    let images;
    if (type === "Array") {
        images = [];
        if (image_url != null && image_url != '') {
            const urls = image_url.split(",");
            for (let i = 0; i < urls.length; i++) {
                const img = urls[i].trim();
                if (img.startsWith('http')) {
                    images.push(img);
                } else {
                    images.push(fileBase + (img.startsWith('/') ? img.slice(1) : img));
                }
            }
        } else {
            images.push(fileBase + 'user-placeholder.jpeg');
        }
    } else {
        if (image_url != null && image_url != '') {
            if (image_url.startsWith('http')) {
                images = image_url;
            } else {
                const path = image_url.startsWith('/') ? image_url.slice(1) : image_url;
                images = fileBase + path;
            }
        } else {
            images = fileBase + 'user-placeholder.jpeg';
        }
    }
    return images;
}

const getUserImageUrl = (image_url, type) => {
    const fileBase = getFileBaseUrl();
    const userPath = UPLOAD_DIRECTORY_MAPPING[UPLOAD_DIRECTORY.USER] + "/";
    let images;
    if (type === "Array") {
        images = [];
        if (image_url != null && image_url != '') {
            const urls = image_url.split(",");
            for (let i = 0; i < urls.length; i++) {
                const img = urls[i].trim();
                if (img.startsWith('http')) {
                    images.push(img);
                } else {
                    images.push(fileBase + userPath + (img.startsWith('/') ? img.slice(1) : img));
                }
            }
        } else {
            images.push(fileBase + userPath + 'user-placeholder.jpeg');
        }
    } else {
        if (image_url != null && image_url != '') {
            if (image_url.startsWith('http')) {
                images = image_url;
            } else {
                const path = image_url.startsWith('/') ? image_url.slice(1) : image_url;
                images = fileBase + userPath + path;
            }
        } else {
            images = fileBase + userPath + 'user-placeholder.jpeg';
        }
    }
    return images;
}


const removeBaseUrl = (text = "") => {
    const base = getFileBaseUrl();
    if (Array.isArray(text)) {
        return text.map((item) => (item || "").replace(base, ""));
    }
    return (text || "").replace(base, "");
};
const getFileUrl = (image_url) => {
    if (image_url != null && image_url != '') {
        if (!image_url.startsWith('http')) {
            const path = image_url.startsWith('/') ? image_url.slice(1) : image_url;
            image_url = getFileBaseUrl() + path;
        }
    }
    return image_url;
}

module.exports = {
    baseUrl,
    getFileBaseUrl,
    getUserDirectory,
    isJSON,
    extractFields,
    validateAll,
    generateHash,
    generateOTP,
    validateAsync,
    compareHash,
    getImageUrl,
    getUserImageUrl,
    getUploadDirectoryPath,
    removeBaseUrl,
    getFileUrl
}
