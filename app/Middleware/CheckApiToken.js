

module.exports = (req, res, next) => {

    let error = {
        status: 401,
        message: "Authorization header is not defined",
        data: {}
    }

    if (!req.headers?.token) {
        return res.status(401).send(error)
    }

    if (req.headers?.token != process.env.CLIENT_ID) {
        error.message = 'Unauthorized header to access this request'
        return res.status(401).send(error)
    }

    next();

}