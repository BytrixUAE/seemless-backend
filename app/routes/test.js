const express = require("express")
const router = express.Router();
const checkApiToken = require('../Middleware/CheckApiToken');


router.get("/", (req, res) => {
    res.send("hello world from test");
})


router.post('/', checkApiToken, (req, res) => {
    res.send("Success");
})


module.exports = router;