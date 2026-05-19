const { USER_UPLOAD_DIRECTORY } = require("./constants")

const ROLES = {
    ADMIN: 'ADMIN',
    USER: 'USER',
}


const UPLOAD_DIRECTORY = {
    USER: "user",
}

const UPLOAD_DIRECTORY_MAPPING = {
    [UPLOAD_DIRECTORY.USER]: 'user',
}

const LOGIN_TYPE = {
    CUSTOM: "custom",
    GOOGLE: "google",
    APPLE: 'apple',
    FACEBOOK: 'facebook'
}

const API_TOKENS_ENUM = {
    ACCESS: "ACCESS",
    RESET: 'RESET'
}

const OTP_VERIFICATION_TYPE = {
    EMAIL: 'EMAIL',
    MOBILE_NO: 'MOBILE_NO'
}


const SETTING_ENUM = {
    PRIVACY_POLICY: 'privacy-policy',
    TERMS_AND_CONDITION: 'terms-and-condition'
}

const SETTING_MAPPING_ENUM = {
    'privacy-policy': SETTING_ENUM.PRIVACY_POLICY,
    'terms-and-condition': SETTING_ENUM.TERMS_AND_CONDITION,
}


const CHAT_ROOM_STATUS_ENUM = {
    PENDING: 'pending',
    ACCEPTED: 'accepted',
    REJECTED: 'rejected'
}

const MESSAGE_TYPE_ENUM = {
    TEXT: 'TEXT',
    FILE: 'FILE',
    BADGE: 'BADGE'
}
const CHAT_ROOM_TYPE_ENUM = {
    SINGLE: 'single',
    GROUP: 'group'
}

const RADIUS_UNIT_ENUM = {
    METERS: 'meters',
    FEET: 'feet',
    YARDS: 'yards'
}
const NOTIFICATION_TYPES = {
    CHAT_MESSAGE: "chat_message",
    ADMIN_NOTIFICATION: "admin_broadcast",
    NEW_ENCOUNTER: "new_encounter",
    relationship_request: "relationship_request",
    relationship_request_accepted: "relationship_request_accepted",
    relationship_request_rejected: "relationship_request_rejected",
    relationship_request_ignored: "relationship_request_ignored",
    relationship_request_blocked: "relationship_request_blocked",
    relationship_request_unblocked: "relationship_request_unblocked",
    relationship_request_deleted: "relationship_request_deleted",
    relationship_request_near_timeout: "relationship_request_near_timeout"
}
const SOCIAL_ACCOUNT_TYPE_ENUM = {
    FACEBOOK: 'facebook',
    INSTAGRAM: 'instagram',
    TWITTER: 'twitter',
    LINKEDIN: 'linkedin',
    SNAPCHAT: 'snapchat',
    TIKTOK: 'tiktok',
    YOUTUBE: 'youtube',
    OTHER: 'other',
}

const GENDER_ENUM = {
    MALE: 10,
    FEMALE: 20,
    OTHER: 30,
}

const SUBSCRIPTION_PACKAGE_TYPE_ENUM = {
    WEEKLY: 'weekly',
    MONTHLY: 'monthly',
    YEARLY: 'yearly',
}

const SUBSCRIPTION_PACKAGE_TYPE_ENUM_TITLE = {
    [SUBSCRIPTION_PACKAGE_TYPE_ENUM.WEEKLY]: 'Week',
    [SUBSCRIPTION_PACKAGE_TYPE_ENUM.MONTHLY]: 'Month',
    [SUBSCRIPTION_PACKAGE_TYPE_ENUM.YEARLY]: 'Year',
}

// Backwards-compatible alias used by older subscription code
const SUBSCRIPTION_PRODUCTS = {
    WEEKLY: SUBSCRIPTION_PACKAGE_TYPE_ENUM.WEEKLY,
    MONTHLY: SUBSCRIPTION_PACKAGE_TYPE_ENUM.MONTHLY,
    YEARLY: SUBSCRIPTION_PACKAGE_TYPE_ENUM.YEARLY,
}

// In-app purchase platforms
const PLATFORMS = {
    IOS: 'ios',
    ANDROID: 'android',
}

const SUBSCRIPTION_TRANSACTION_PAYMENT_TYPE_ENUM = {
    INITIAL: 'initial',
    RENEWAL: 'renewal',
    REFUND: 'refund',
    PARTIAL_REFUND: 'partial_refund',
    CHARGEBACK: 'chargeback',
}

const SUBSCRIPTION_TRANSACTION_STATUS_ENUM = {
    PENDING: 'pending',
    SUCCEEDED: 'succeeded',
    FAILED: 'failed',
    REFUNDED: 'refunded',
    PARTIALLY_REFUNDED: 'partially_refunded',
    DISPUTED: 'disputed',
}
const USER_RELATIONSHIP_ACTION_ENUM = {
    REQUESTED: 10,
    ACCEPTED: 20,
    IGNORED: 30,
    BLOCKED: 40,
}

const SUPPORT_TICKET_STATUS_ENUM = {
    PENDING: 10,
    RESOLVED: 20,
    CLOSED: 30,
}

const CONNECTION_REQUEST_TIMEOUT_MINUTES = 20;

const CHAT_MESSAGE_INSTANCE_TYPE = {
    AUDIO: 10,
    VIDEO: 20,
    IMAGE: 30,
    DOCUMENT: 40,
}
// audio: 10, video: 20, image: 30, document: 40)
const ATTACHMENT_TYPES = {
    AUDIO: 10,
    VIDEO: 20,
    IMAGE: 30,
    DOCUMENT: 40,
}
const INSTANCE_TYPES = {
    USERS: 10,
    RELATIONSHIP: 20,
    USER_REPORT: 30,
    SUPPORT_TICKET: 40,
    REPORT_REASON: 50,
}

const USER_REPORT_STATUS_ENUM = {
    PENDING: 10,
    SORTED: 20,
    BLOCKED: 30
}
module.exports = {
    ROLES,
    LOGIN_TYPE,
    API_TOKENS_ENUM,
    OTP_VERIFICATION_TYPE,
    UPLOAD_DIRECTORY,
    UPLOAD_DIRECTORY_MAPPING,
    SETTING_ENUM,
    SETTING_MAPPING_ENUM,
    CHAT_ROOM_STATUS_ENUM,
    MESSAGE_TYPE_ENUM,
    CHAT_ROOM_TYPE_ENUM,
    NOTIFICATION_TYPES,
    SOCIAL_ACCOUNT_TYPE_ENUM,
    GENDER_ENUM,
    SUBSCRIPTION_PACKAGE_TYPE_ENUM,
    SUBSCRIPTION_PACKAGE_TYPE_ENUM_TITLE,
    SUBSCRIPTION_PRODUCTS,
    PLATFORMS,
    SUBSCRIPTION_TRANSACTION_PAYMENT_TYPE_ENUM,
    SUBSCRIPTION_TRANSACTION_STATUS_ENUM,
    USER_RELATIONSHIP_ACTION_ENUM,
    CONNECTION_REQUEST_TIMEOUT_MINUTES,
    SUPPORT_TICKET_STATUS_ENUM,
    INSTANCE_TYPES,
    ATTACHMENT_TYPES,
    USER_REPORT_STATUS_ENUM,
    RADIUS_UNIT_ENUM,
    CHAT_MESSAGE_INSTANCE_TYPE,
}