const express = require("express")
const router = express.Router();
const UserController = require("../Controllers/Api/UserController");


router.get("/", (req, res) => {
    res.send("hello world from test");
})


/* User Configure Account Routes */
router.get('/reset-password/:resetPasswordToken', (req, res) => (new UserController()).resetPassword({ request: req, response: res }))
router.post('/reset-password', (req, res) => (new UserController()).resetPasswordSubmit({ request: req, response: res }))

// Stripe webhook is registered in server.js with express.raw() so the raw body is available for signature verification.

module.exports = router;