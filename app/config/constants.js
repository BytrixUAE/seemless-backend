function parseFirebaseServiceAccount() {
    const raw = process.env.SERVICE_ACCOUNT || process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!raw || !String(raw).trim()) {
        return null;
    }

    try {
        let trimmed = String(raw).trim();
        // Hosting panels / docker -e often pass quoted JSON literally (e.g. '{"type":...}').
        // dotenv strips these from .env files locally; raw process.env on live may still include them.
        if (
            (trimmed.startsWith("'") && trimmed.endsWith("'")) ||
            (trimmed.startsWith('"') && trimmed.endsWith('"'))
        ) {
            trimmed = trimmed.slice(1, -1);
        }
        const account = JSON.parse(trimmed);
        if (!account.client_email || !account.private_key) {
            throw new Error('service account JSON must include client_email and private_key');
        }
        if (typeof account.private_key === 'string') {
            account.private_key = account.private_key.replace(/\\n/g, '\n');
        }
        return account;
    } catch (err) {
        throw new Error(
            `Invalid Firebase SERVICE_ACCOUNT in environment: ${err.message}. ` +
            'Set SERVICE_ACCOUNT to a single-line JSON string (see .env.example).'
        );
    }
}

module.exports = {
    PASSWORD_SALT_ROUND: 6,
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_EXPIRY: process.env.JWT_EXPIRY,
    CLIENT_ID: process.env.CLIENT_ID,
    BASE_URL: process.env.BASE_URL,
    FILE_SYSTEM: process.env.FILE_SYSTEM || 'local',
    SAMPLE_PASSWORD: 'seemLess@123',
    // S3 (used when FILE_SYSTEM=s3)
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
    AWS_REGION: process.env.AWS_S3_REGION || process.env.AWS_REGION || 'us-east-2',
    AWS_S3_BUCKET: process.env.AWS_S3_BUCKET || 'seemless-user-images',
    S3_PUBLIC_URL: process.env.S3_PUBLIC_URL,
    /** Optional: public base URL for S3 files (e.g. https://bucket.s3.region.amazonaws.com or CloudFront) */

    MAIL_SYSTEM: process.env.MAIL_SYSTEM,
    MAIL_API_KEY: process.env.MAIL_API_KEY,
    MAIL_HOST: process.env.MAIL_HOST,
    MAIL_PORT: process.env.MAIL_PORT,
    MAIL_EMAIL: process.env.MAIL_EMAIL,
    MAIL_PASSWORD: process.env.MAIL_PASSWORD,
    MAIL_FROM: process.env.MAIL_FROM,
    EMAIL_VERIFICATION: 1,
    SMS_VERIFICATION: 0,
    SMS_SYSTEM: process.env.SMS_SYSTEM || 'Twilio',

    PAGINATION_LIMIT: 20,
    LOOKUPS_ID: "de6683e5-9241-4ffc-9bf6-06d4cc614c37",
    STATIC_PAGE_ID: "c19c2f29-8e79-471c-b01d-e88d806bc0a7",

    USER_UPLOAD_DIRECTORY: 'user',

    NOTIFICATION_DRIVER: process.env.NOTIFICATION_DRIVER || "Firebase",
    SERVICE_ACCOUNT: parseFirebaseServiceAccount(),

}