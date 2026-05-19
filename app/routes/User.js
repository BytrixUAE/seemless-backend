const express = require("express")
const router = express.Router();
const multer = require("multer");
const upload = multer()

const checkApiToken = require('../Middleware/CheckApiToken');
const apiAuthentication = require("../Middleware/ApiAuthentication");

const UserOTPController = require("../Controllers/Api/User/UserOTPController");
const OTPTokenAuthentication = require("../Middleware/OTPTokenAuthentication");


const SettingController = require("../Controllers/Api/User/SettingController");
const PageController = require("../Controllers/Api/PageController");
const LookupController = require("../Controllers/Api/User/LookupController");
const UserController = require("../Controllers/Api/User/UserController");
const UserApiTokenController = require("../Controllers/Api/User/UserApiTokenController");
const NotificationController = require("../Controllers/Api/NotificationController");
const AdminUserController = require("../Controllers/Api/Admin/UserController");
const AppUpdateController = require("../Controllers/Api/AppUpdateController");
const SubscriberControllerInapp = require("../Controllers/SubscriberControllerInapp");



/*---------------------------------- AppUpdate ROUTES------------------------------*/
router.get("/app-updates", checkApiToken, (req, res) => (new AppUpdateController()).index({ request: req, response: res }))

/*---------------------------------- In-App Purchase Webhooks ------------------------------*/
// router.post("/inapp/webhook/ios", checkApiToken, (req, res) => (new SubscriberControllerInapp()).iosSubscriptionWebHook({ request: req, response: res }))
// router.post("/inapp/webhook/android", checkApiToken, (req, res) => (new SubscriberControllerInapp()).androidSubscriptionWebHook({ request: req, response: res }))

/*----------------------------------  Notification Routes  ------------------------------*/
router.get('/notifications', apiAuthentication, (req, res) => (new NotificationController()).index({
    request: req,
    response: res
}))
router.get('/get-unread-count', apiAuthentication, (req, res) => (new NotificationController()).getUnreadCount({
    request: req,
    response: res
}))
router.post('/mark-all-read', apiAuthentication, (req, res) => (new NotificationController()).markAllRead({
    request: req,
    response: res
}))
router.post('/mark-single-read/:id', apiAuthentication, (req, res) => (new NotificationController()).markSingleRead({
    request: req,
    response: res
}))
router.post('/send-test-notification', apiAuthentication, (req, res) => (new NotificationController()).sendTestNotification({
    request: req,
    response: res
}))

/*---------------------------------- Attachments ROUTES ------------------------------*/
router.post('/upload-attachments', apiAuthentication, (req, res) => (new UserController()).uploadAttachments({ request: req, response: res }))


/*----------------------------------   Lookups Routes  ------------------------------*/
router.get('/lookup', (req, res) => (new LookupController()).index({ request: req, response: res }))


/*----------------------------------   Setting Routes  ------------------------------*/
router.get('/setting', checkApiToken, (req, res) => (new SettingController()).index({ request: req, response: res }))

/*---------------------------------- Page ROUTES------------------------------*/
router.get("/page", checkApiToken, (req, res) => (new PageController()).index({ request: req, response: res }))
router.get("/page/:slug", checkApiToken, (req, res) => (new PageController()).getRecordBySlug({ request: req, response: res }))

/*----------------------------------   OTP Routes  ------------------------------*/
router.post('/send-otp/mail', checkApiToken, (req, res) => (new UserOTPController()).store({ request: req, response: res }))
router.post('/verify-otp/register', checkApiToken, (req, res) => (new UserOTPController()).verifyOTPRegister({ request: req, response: res }))
router.post('/verify-otp/forgot-password', checkApiToken, (req, res) => (new UserOTPController()).verifyOTPForgotPassword({ request: req, response: res }))


/* User Configure Account Routes */
router.post('/', checkApiToken, upload.any(), (req, res) => (new UserController()).store({ request: req, response: res }))
router.post('/login', checkApiToken, (req, res) => (new UserController()).login({ request: req, response: res }))
router.patch('/device-token', apiAuthentication, (req, res) => (new UserApiTokenController()).update({ request: req, response: res }))
router.post('/social-login', checkApiToken, (req, res) => (new UserController()).socialLogin({ request: req, response: res }))
router.patch('/', apiAuthentication, (req, res) => (new UserController()).update({ request: req, response: res }))
router.post('/toggle-notification', apiAuthentication, (req, res) => (new UserController()).toggleNotification({ request: req, response: res }))
router.get('/', apiAuthentication, (req, res) => (new UserController()).getMyProfile({ request: req, response: res }))
router.get('/all-users', apiAuthentication, (req, res) => (new UserController()).index({ request: req, response: res }))
router.get('/other-profile/:id', apiAuthentication, (req, res) => (new UserController()).getOtherProfile({ request: req, response: res }))
router.post('/forgot-password', checkApiToken, (req, res) => (new UserController()).forgotPassword({ request: req, response: res }))
router.post('/change-password', apiAuthentication, (req, res) => (new UserController()).changePassword({ request: req, response: res }))
router.post('/set-password', OTPTokenAuthentication.authenticate, (req, res) => (new UserController()).setNewPassword({ request: req, response: res }))
router.post('/update-device-token', apiAuthentication, (req, res) => (new UserController()).updateDeviceToken({ request: req, response: res }))
router.post('/logout', apiAuthentication, (req, res) => (new UserController()).logout({ request: req, response: res }))
router.delete('/', checkApiToken, apiAuthentication, (req, res) => (new UserController()).destroy({ request: req, response: res }))
router.post('/forgot-password-link', checkApiToken, (req, res) => (new AdminUserController()).forgotPassword({ request: req, response: res }))

const SubscriptionPackageController = require("../Controllers/Api/SubscriptionPackageController");
/*---------------------------------- SubscriptionPackage ROUTES ------------------------------*/
router.get("/subscription-package", apiAuthentication, (req, res) => (new SubscriptionPackageController()).index({ request: req, response: res }))
router.get("/subscription-package/:id", apiAuthentication, (req, res) => (new SubscriptionPackageController()).show({ request: req, response: res }))

const SubscriptionController = require("../Controllers/Api/SubscriptionController");
/*---------------------------------- In-app purchase (IAP) — literal paths before /subscription/:id ------------------------------*/
router.post("/subscription/create", apiAuthentication, (req, res) => (new SubscriberControllerInapp()).store({ request: req, response: res }));
router.post("/restore-subscription", apiAuthentication, (req, res) => (new SubscriberControllerInapp()).restoreAppleSubscription({ request: req, response: res }));
router.get("/subscription/get-active-subscription", apiAuthentication, (req, res) => (new SubscriberControllerInapp()).getActiveSubscription({ request: req, response: res }));

/*---------------------------------- Subscription ROUTES (Stripe / DB) ------------------------------*/
router.get("/subscription", apiAuthentication, (req, res) => (new SubscriptionController()).index({ request: req, response: res }))
router.get("/subscription/:id", apiAuthentication, (req, res) => (new SubscriptionController()).show({ request: req, response: res }))
router.post("/subscription", apiAuthentication, (req, res) => (new SubscriptionController()).store({ request: req, response: res }))
router.post("/subscription/create-stripe-subscription", apiAuthentication, (req, res) => (new SubscriptionController()).createStripeSubscription({ request: req, response: res }))
router.post("/subscription/upgrade", apiAuthentication, (req, res) => (new SubscriptionController()).upgradeSubscription({ request: req, response: res }))
router.post("/subscription/cancel", apiAuthentication, (req, res) => (new SubscriptionController()).cancelSubscription({ request: req, response: res }))
router.get("/subscription-transactions", apiAuthentication, (req, res) => (new SubscriptionController()).getUserTransactions({ request: req, response: res }))
router.post("/payment/create-payment-method", apiAuthentication, (req, res) => (new SubscriptionController()).createPaymentMethod({ request: req, response: res }))
router.patch("/subscription/:id", apiAuthentication, (req, res) => (new SubscriptionController()).update({ request: req, response: res }))
router.delete("/subscription/:id", apiAuthentication, (req, res) => (new SubscriptionController()).destroy({ request: req, response: res }))

const UserSocialAccountController = require("../Controllers/Api/UserSocialAccountController");
/*---------------------------------- UserSocialAccount ROUTES ------------------------------*/
router.get("/user-social-account", apiAuthentication, (req, res) => (new UserSocialAccountController()).index({ request: req, response: res }))
router.get("/user-social-account/:id", apiAuthentication, (req, res) => (new UserSocialAccountController()).show({ request: req, response: res }))
router.post("/user-social-account", apiAuthentication, (req, res) => (new UserSocialAccountController()).store({ request: req, response: res }))
router.patch("/user-social-account/:id", apiAuthentication, (req, res) => (new UserSocialAccountController()).update({ request: req, response: res }))
router.delete("/user-social-account/:id", apiAuthentication, (req, res) => (new UserSocialAccountController()).destroy({ request: req, response: res }))

const UserBlockController = require("../Controllers/Api/UserBlockController");
/*---------------------------------- UserBlock ROUTES ------------------------------*/
router.get("/user-block", apiAuthentication, (req, res) => (new UserBlockController()).index({ request: req, response: res }))
router.get("/user-block/:id", apiAuthentication, (req, res) => (new UserBlockController()).show({ request: req, response: res }))
router.post("/user-block", apiAuthentication, (req, res) => (new UserBlockController()).store({ request: req, response: res }))
router.post("/user-unblock", apiAuthentication, (req, res) => (new UserBlockController()).unblock({ request: req, response: res }))
router.patch("/user-block/:id", apiAuthentication, (req, res) => (new UserBlockController()).update({ request: req, response: res }))
router.delete("/user-block/:id", apiAuthentication, (req, res) => (new UserBlockController()).destroy({ request: req, response: res }))

const UserRelationshipController = require("../Controllers/Api/UserRelationshipController");
/*---------------------------------- UserRelationship ROUTES ------------------------------*/
router.get("/user-relationship", apiAuthentication, (req, res) => (new UserRelationshipController()).index({ request: req, response: res }))
router.get("/user-relationship/:id", apiAuthentication, (req, res) => (new UserRelationshipController()).show({ request: req, response: res }))
router.post("/user-relationship", apiAuthentication, (req, res) => (new UserRelationshipController()).store({ request: req, response: res }))
router.post("/user-relationship/search", apiAuthentication, (req, res) => (new UserRelationshipController()).search({ request: req, response: res }))
router.post("/user-relationship/search-offline", apiAuthentication, (req, res) => (new UserRelationshipController()).searchOffline({ request: req, response: res }))
router.post("/user-relationship/search-uuids", apiAuthentication, (req, res) => (new UserRelationshipController()).searchUuids({ request: req, response: res }))
router.patch("/user-relationship/:id", apiAuthentication, (req, res) => (new UserRelationshipController()).update({ request: req, response: res }))
router.delete("/user-relationship/:id", apiAuthentication, (req, res) => (new UserRelationshipController()).destroy({ request: req, response: res }))

const supportTicketController = require("../Controllers/Api/supportTicketController");
/*---------------------------------- supportTicket ROUTES ------------------------------*/
router.get("/support-ticket", apiAuthentication, (req, res) => (new supportTicketController()).index({ request: req, response: res }))
router.get("/support-ticket/:id", apiAuthentication, (req, res) => (new supportTicketController()).show({ request: req, response: res }))
router.post("/support-ticket", apiAuthentication, (req, res) => (new supportTicketController()).store({ request: req, response: res }))
router.patch("/support-ticket/:id", apiAuthentication, (req, res) => (new supportTicketController()).update({ request: req, response: res }))
router.delete("/support-ticket/:id", apiAuthentication, (req, res) => (new supportTicketController()).destroy({ request: req, response: res }))


const ReportReasonController = require("../Controllers/Api/ReportReasonController");
/*---------------------------------- ReportReason ROUTES ------------------------------*/
router.get("/report-reason", apiAuthentication, (req, res) => (new ReportReasonController()).index({ request: req, response: res }))
router.get("/report-reason/:id", apiAuthentication, (req, res) => (new ReportReasonController()).show({ request: req, response: res }))
// router.post("/report-reason", apiAuthentication, (req, res) => (new ReportReasonController()).store({ request: req, response: res }))
// router.patch("/report-reason/:id", apiAuthentication, (req, res) => (new ReportReasonController()).update({ request: req, response: res }))
// router.delete("/report-reason/:id", apiAuthentication, (req, res) => (new ReportReasonController()).destroy({ request: req, response: res }))


const UserReportController = require("../Controllers/Api/UserReportController");
/*---------------------------------- UserReport ROUTES ------------------------------*/
// router.get("/user-report", apiAuthentication, (req, res) => (new UserReportController()).index({ request: req, response: res }))
// router.get("/user-report/:id", apiAuthentication, (req, res) => (new UserReportController()).show({ request: req, response: res }))
router.post("/user-report", apiAuthentication, (req, res) => (new UserReportController()).store({ request: req, response: res }))
router.patch("/user-report/:id", apiAuthentication, (req, res) => (new UserReportController()).update({ request: req, response: res }))
// router.delete("/user-report/:id", apiAuthentication, (req, res) => (new UserReportController()).destroy({ request: req, response: res }))


const AttachmentController = require("../Controllers/Api/AttachmentController");
/*---------------------------------- Attachment ROUTES ------------------------------*/
router.get("/attachment", apiAuthentication, (req, res) => (new AttachmentController()).index({ request: req, response: res }))
router.get("/attachment/:id", apiAuthentication, (req, res) => (new AttachmentController()).show({ request: req, response: res }))
// router.post("/attachment", apiAuthentication, (req, res) => (new AttachmentController()).store({ request: req, response: res }))
// router.patch("/attachment/:id", apiAuthentication, (req, res) => (new AttachmentController()).update({ request: req, response: res }))
// router.delete("/attachment/:id", apiAuthentication, (req, res) => (new AttachmentController()).destroy({ request: req, response: res }))

const HobbyController = require("../Controllers/Api/HobbyController");
/*---------------------------------- Hobby ROUTES ------------------------------*/
router.get("/hobby", apiAuthentication, (req, res) => (new HobbyController()).index({ request: req, response: res }))
router.get("/hobby/:id", apiAuthentication, (req, res) => (new HobbyController()).show({ request: req, response: res }))
// router.post("/hobby", apiAuthentication, (req, res) => (new HobbyController()).store({ request: req, response: res }))
// router.patch("/hobby/:id", apiAuthentication, (req, res) => (new HobbyController()).update({ request: req, response: res }))
// router.delete("/hobby/:id", apiAuthentication, (req, res) => (new HobbyController()).destroy({ request: req, response: res }))


const UserHobbyController = require("../Controllers/Api/UserHobbyController");
/*---------------------------------- UserHobby ROUTES ------------------------------*/
router.get("/user-hobby", apiAuthentication, (req, res) => (new UserHobbyController()).index({ request: req, response: res }))
router.get("/user-hobby/:id", apiAuthentication, (req, res) => (new UserHobbyController()).show({ request: req, response: res }))
router.post("/user-hobby", apiAuthentication, (req, res) => (new UserHobbyController()).store({ request: req, response: res }))
router.patch("/user-hobby/:id", apiAuthentication, (req, res) => (new UserHobbyController()).update({ request: req, response: res }))
router.delete("/user-hobby/:id", apiAuthentication, (req, res) => (new UserHobbyController()).destroy({ request: req, response: res }))

module.exports = router;
