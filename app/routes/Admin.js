const express = require("express");
const router = express.Router();

const CheckApiToken = require("../Middleware/CheckApiToken");
const AdminApiAuthentication = require("../Middleware/AdminApiAuthentication");

const UserController = require("../Controllers/Api/Admin/UserController");
const PageController = require("../Controllers/Api/PageController");
const LookupController = require("../Controllers/Api/Admin/LookupController");
const LookupDataController = require("../Controllers/Api/Admin/LookupDataController");
const AppUserController = require("../Controllers/Api/User/UserController");
const AppUpdateController = require("../Controllers/Api/AppUpdateController");
const ApiUserController = require("../Controllers/Api/User/UserController");
const UserOTPController = require("../Controllers/Api/User/UserOTPController");
// const AdminOTPTokenAuthentication = require("../Middleware/AdminOTPTokenAuthentication");
const AdminOTPTokenAuthentication = require("../Middleware/AdminOTPTokenAuthentication");
const SettingController = require("../Controllers/Api/User/SettingController");


/*---------------------------------- Dashboard ROUTES ------------------------------*/
router.get("/dashboard", AdminApiAuthentication.authenticate, (req, res) => (new UserController()).getDashboardStats({ request: req, response: res }))
router.get("/dashboard/graph", AdminApiAuthentication.authenticate, (req, res) => (new UserController()).getDashboardGraph({ request: req, response: res }))

router.get("/app-updates", AdminApiAuthentication.authenticate, (req, res) => (new AppUpdateController()).index({ request: req, response: res }))
router.post("/app-updates", AdminApiAuthentication.authenticate, (req, res) => (new AppUpdateController()).store({ request: req, response: res }))

/*---------------------------------- Attachments ROUTES ------------------------------*/
router.post('/upload-attachments', AdminApiAuthentication.authenticate, (req, res) => (new AppUserController()).uploadAttachments({ request: req, response: res }))

/*----------------------------------   Lookups Routes  ------------------------------*/
router.get('/lookup', AdminApiAuthentication.authenticate, (req, res) => (new LookupController()).index({ request: req, response: res }))
router.post('/lookup/:id', AdminApiAuthentication.authenticate, (req, res) => (new LookupDataController()).store({ request: req, response: res }))

/*---------------------------------- Page ROUTES ------------------------------*/
router.get("/page", AdminApiAuthentication.authenticate, (req, res) => (new PageController()).index({ request: req, response: res }))
router.get("/page/:id", AdminApiAuthentication.authenticate, (req, res) => (new PageController()).show({ request: req, response: res }))
router.get("/page-slug/:slug", AdminApiAuthentication.authenticate, (req, res) => (new PageController()).getRecordBySlug({ request: req, response: res }))
router.post("/page", AdminApiAuthentication.authenticate, (req, res) => (new PageController()).store({ request: req, response: res }))
router.patch("/page/:id", AdminApiAuthentication.authenticate, (req, res) => (new PageController()).update({ request: req, response: res }))
router.delete("/page/:id", AdminApiAuthentication.authenticate, (req, res) => (new PageController()).destroy({ request: req, response: res }))

/*----------------------------------   Account Routes  ------------------------------*/
router.post('/login', CheckApiToken, (req, res) => (new UserController()).login({ request: req, response: res }))
router.patch('/', AdminApiAuthentication.authenticate, (req, res) => (new UserController()).update({ request: req, response: res }))
router.post('/forgot-password', CheckApiToken, (req, res) => (new UserController()).forgotPassword({ request: req, response: res }))
router.post('/change-password', AdminApiAuthentication.authenticate, (req, res) => (new UserController()).changePassword({ request: req, response: res }))
router.post('/logout', AdminApiAuthentication.authenticate, (req, res) => (new UserController()).logout({ request: req, response: res }))
router.get('/', AdminApiAuthentication.authenticate, (req, res) => (new UserController()).getMyProfile({ request: req, response: res }))
router.post('/users/make-special', AdminApiAuthentication.authenticate, (req, res) => (new UserController()).markSpecialUsers({ request: req, response: res }))
router.get('/get-all-users', AdminApiAuthentication.authenticate, (req, res) => (new ApiUserController()).index({ request: req, response: res }))
router.get('/get-user-by-id/:id', AdminApiAuthentication.authenticate, (req, res) => (new ApiUserController()).getOtherProfile({ request: req, response: res }))
router.patch('/update-user/:id', AdminApiAuthentication.authenticate, (req, res) => (new UserController()).updateUser({ request: req, response: res }))
router.delete('/delete-user/:id', AdminApiAuthentication.authenticate, (req, res) => (new UserController()).deleteUser({ request: req, response: res }))
router.post('/send-otp/mail', CheckApiToken, (req, res) => (new UserOTPController()).store({ request: req, response: res }))
router.post('/verify-otp/forgot-password', CheckApiToken, (req, res) => (new UserOTPController()).verifyOTPForgotPassword({ request: req, response: res }))
router.post('/set-password', AdminOTPTokenAuthentication.authenticate, (req, res) => (new ApiUserController()).setNewPassword({ request: req, response: res }))

const SubscriptionPackageController = require("../Controllers/Api/SubscriptionPackageController");
// /*---------------------------------- SubscriptionPackage ROUTES ------------------------------*/
router.get("/subscription-package", AdminApiAuthentication.authenticate, (req, res) => (new SubscriptionPackageController()).index({ request: req, response: res }))
router.get("/subscription-package/:id", AdminApiAuthentication.authenticate, (req, res) => (new SubscriptionPackageController()).show({ request: req, response: res }))
router.post("/subscription-package", AdminApiAuthentication.authenticate, (req, res) => (new SubscriptionPackageController()).store({ request: req, response: res }))
router.patch("/subscription-package/:id", AdminApiAuthentication.authenticate, (req, res) => (new SubscriptionPackageController()).update({ request: req, response: res }))
router.delete("/subscription-package/:id", AdminApiAuthentication.authenticate, (req, res) => (new SubscriptionPackageController()).destroy({ request: req, response: res }))
router.get("/subscription-transactions", AdminApiAuthentication.authenticate, (req, res) => (new SubscriptionController()).getAllUserTransactions({ request: req, response: res }))


const SubscriptionController = require("../Controllers/Api/SubscriptionController");
// /*---------------------------------- Subscription ROUTES ------------------------------*/
router.get("/subscription", AdminApiAuthentication.authenticate, (req, res) => (new SubscriptionController()).index({ request: req, response: res }))
router.get("/subscription-stats", AdminApiAuthentication.authenticate, (req, res) => (new SubscriptionController()).getSubscriptionStats({ request: req, response: res }))
router.get("/subscription/:id", AdminApiAuthentication.authenticate, (req, res) => (new SubscriptionController()).show({ request: req, response: res }))
router.post("/subscription", AdminApiAuthentication.authenticate, (req, res) => (new SubscriptionController()).store({ request: req, response: res }))
router.patch("/subscription/:id", AdminApiAuthentication.authenticate, (req, res) => (new SubscriptionController()).update({ request: req, response: res }))
router.delete("/subscription/:id", AdminApiAuthentication.authenticate, (req, res) => (new SubscriptionController()).destroy({ request: req, response: res }))

router.get('/setting', AdminApiAuthentication.authenticate, (req, res) => (new SettingController()).index({ request: req, response: res }))
router.patch('/setting/:id', AdminApiAuthentication.authenticate, (req, res) => (new SettingController()).update({ request: req, response: res }))


const supportTicketController = require("../Controllers/Api/supportTicketController");
/*---------------------------------- supportTicket ROUTES ------------------------------*/
router.get("/support-ticket", AdminApiAuthentication.authenticate, (req, res) => (new supportTicketController()).index({ request: req, response: res }))
router.get("/support-ticket/:id", AdminApiAuthentication.authenticate, (req, res) => (new supportTicketController()).show({ request: req, response: res }))
router.post("/support-ticket", AdminApiAuthentication.authenticate, (req, res) => (new supportTicketController()).store({ request: req, response: res }))
router.patch("/support-ticket/:id", AdminApiAuthentication.authenticate, (req, res) => (new supportTicketController()).update({ request: req, response: res }))
router.delete("/support-ticket/:id", AdminApiAuthentication.authenticate, (req, res) => (new supportTicketController()).destroy({ request: req, response: res }))


const ReportReasonController = require("../Controllers/Api/ReportReasonController");
/*---------------------------------- ReportReason ROUTES ------------------------------*/
router.get("/report-reason", AdminApiAuthentication.authenticate, (req, res) => (new ReportReasonController()).index({ request: req, response: res }))
router.get("/report-reason/:id", AdminApiAuthentication.authenticate, (req, res) => (new ReportReasonController()).show({ request: req, response: res }))
router.post("/report-reason", AdminApiAuthentication.authenticate, (req, res) => (new ReportReasonController()).store({ request: req, response: res }))
router.patch("/report-reason/:id", AdminApiAuthentication.authenticate, (req, res) => (new ReportReasonController()).update({ request: req, response: res }))
router.delete("/report-reason/:id", AdminApiAuthentication.authenticate, (req, res) => (new ReportReasonController()).destroy({ request: req, response: res }))


const UserReportController = require("../Controllers/Api/UserReportController");
/*---------------------------------- UserReport ROUTES ------------------------------*/
router.get("/user-report", AdminApiAuthentication.authenticate, (req, res) => (new UserReportController()).index({ request: req, response: res }))
router.get("/user-report/:id", AdminApiAuthentication.authenticate, (req, res) => (new UserReportController()).show({ request: req, response: res }))
router.post("/user-report", AdminApiAuthentication.authenticate, (req, res) => (new UserReportController()).store({ request: req, response: res }))
router.patch("/user-report/:id", AdminApiAuthentication.authenticate, (req, res) => (new UserReportController()).update({ request: req, response: res }))
router.delete("/user-report/:id", AdminApiAuthentication.authenticate, (req, res) => (new UserReportController()).destroy({ request: req, response: res }))


const AttachmentController = require("../Controllers/Api/AttachmentController");
/*---------------------------------- Attachment ROUTES ------------------------------*/
router.get("/attachment", AdminApiAuthentication.authenticate, (req, res) => (new AttachmentController()).index({ request: req, response: res }))
router.get("/attachment/:id", AdminApiAuthentication.authenticate, (req, res) => (new AttachmentController()).show({ request: req, response: res }))
router.post("/attachment", AdminApiAuthentication.authenticate, (req, res) => (new AttachmentController()).store({ request: req, response: res }))
router.patch("/attachment/:id", AdminApiAuthentication.authenticate, (req, res) => (new AttachmentController()).update({ request: req, response: res }))
router.delete("/attachment/:id", AdminApiAuthentication.authenticate, (req, res) => (new AttachmentController()).destroy({ request: req, response: res }))

const NotificationController = require("../Controllers/Api/NotificationController");
/*---------------------------------- Notification ROUTES ------------------------------*/
router.post("/send-push-notification", AdminApiAuthentication.authenticate, (req, res) => (new NotificationController()).sendPushNotification({ request: req, response: res }))


const HobbyController = require("../Controllers/Api/HobbyController");
/*---------------------------------- Hobby ROUTES ------------------------------*/
router.get("/hobby", AdminApiAuthentication.authenticate, (req, res) => (new HobbyController()).index({ request: req, response: res }))
router.get("/hobby/:id", AdminApiAuthentication.authenticate, (req, res) => (new HobbyController()).show({ request: req, response: res }))
router.post("/hobby", AdminApiAuthentication.authenticate, (req, res) => (new HobbyController()).store({ request: req, response: res }))
router.patch("/hobby/:id", AdminApiAuthentication.authenticate, (req, res) => (new HobbyController()).update({ request: req, response: res }))
router.delete("/hobby/:id", AdminApiAuthentication.authenticate, (req, res) => (new HobbyController()).destroy({ request: req, response: res }))


const UserHobbyController = require("../Controllers/Api/UserHobbyController");
/*---------------------------------- UserHobby ROUTES ------------------------------*/
router.get("/user-hobby", AdminApiAuthentication.authenticate, (req, res) => (new UserHobbyController()).index({ request: req, response: res }))
router.get("/user-hobby/:id", AdminApiAuthentication.authenticate, (req, res) => (new UserHobbyController()).show({ request: req, response: res }))
router.post("/user-hobby", AdminApiAuthentication.authenticate, (req, res) => (new UserHobbyController()).store({ request: req, response: res }))
router.patch("/user-hobby/:id", AdminApiAuthentication.authenticate, (req, res) => (new UserHobbyController()).update({ request: req, response: res }))
router.delete("/user-hobby/:id", AdminApiAuthentication.authenticate, (req, res) => (new UserHobbyController()).destroy({ request: req, response: res }))


module.exports = router