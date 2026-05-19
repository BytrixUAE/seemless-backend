const express = require("express");
const http = require('http');
const path = require('path');
const cors = require("cors");
const bodyParser = require('body-parser');
const multer = require('multer');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const flash = require('connect-flash');
const upload = multer();
const { v4: uuidv4 } = require('uuid');
const process = require('process');
const morgan = require("morgan");

require('dotenv').config();
const app = express();
const db = require("./app/Database/index");
const { sequelize, user_groups, users, pages, settings, Op } = db;

const { testRouter, userRoutes, controllerRoutes, adminRoutes } = require('./app/routes');
const { ROLES, UPLOAD_DIRECTORY_MAPPING, UPLOAD_DIRECTORY, USER_RELATIONSHIP_ACTION_ENUM, CONNECTION_REQUEST_TIMEOUT_MINUTES, NOTIFICATION_TYPES } = require("./app/config/enum");
const FileHandler = require("./app/Libraries/FileHandler/FileHandler");
const { getUserDirectory, generateHash } = require("./app/Helper");
const Socket = require("./socket.js");
const UserRelationship = require("./app/Models/UserRelationship");

app.use(morgan((tokens, req, res) => {
    console.log(
        "\x1b[31m" + tokens.method(req, res),
        "\x1b[32m" + tokens.url(req, res),
        "\x1b[33m" + tokens.status(req, res),
        "\x1b[34m" + tokens['response-time'](req, res) + 'ms' + "\n",
        "\x1b[31m" + "Token---->>>>" + JSON.stringify(req.headers.token) + "\n",
        "\x1b[32m" + "API Token---->>>>" + JSON.stringify(req.headers.authorization) + "\n",
        "\x1b[33m" + "Params---->>>>" + JSON.stringify(req.params) + "\n",
        "\x1b[34m" + "Query---->>>>" + JSON.stringify(req.query) + "\n",
        "\x1b[31m" + "Body---->>>>" + JSON.stringify(req.body) + "\n",
        "\x1b[0m"
    );
}));
if (process.env.APP_ENV == "production"){
    // disable console log
    console.log = function () {};
}
/**App Setup */
app.use(upload.any());
app.use(cors());

// Stripe webhook MUST use raw body for signature verification - register before bodyParser.json()
app.post('/web/stripe-webhook', bodyParser.raw({ type: 'application/json' }), (req, res) => {
    const SubscriptionController = require("./app/Controllers/Api/SubscriptionController");
    (new SubscriptionController()).handleStripeWebhook({ request: req, response: res });
});


app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
// In-app purchase webhooks — MUST use bodyParser.json() on the route: global json() is registered *below* and never runs before these handlers
app.post('/web/inapp/webhook/ios', bodyParser.json({ type: '*/*' }), (req, res) => {
    const SubscriberControllerInapp = require("./app/Controllers/SubscriberControllerInapp");
    (new SubscriberControllerInapp()).iosSubscriptionWebHook({ request: req, response: res });
});
app.post('/web/inapp/webhook/android', bodyParser.json({ type: '*/*' }), (req, res) => {
    const SubscriberControllerInapp = require("./app/Controllers/SubscriberControllerInapp");
    (new SubscriberControllerInapp()).androidSubscriptionWebHook({ request: req, response: res });
});
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "/templates"));
app.use('/', express.static('uploads'));
//app.use('/' + UPLOAD_DIRECTORY_MAPPING[UPLOAD_DIRECTORY.USER], express.static('upload/' + UPLOAD_DIRECTORY.USER));

// Set Cookie Parser, sessions and flash
app.use(cookieParser('NotSoSecret'));
app.use(session({
    secret: 'something',
    cookie: { maxAge: 60000 },
    resave: true,
    saveUninitialized: true
}));
app.use(flash());
app.use(function (req, res, next) {
    res.locals.message = req.flash();
    next();
});
// Error handling middleware
app.use((err, req, res, next) => {
    if (err) {
        console.log("err:",err)
        res.status(500).send({
            code: 500,
            message: err.message,
            data: {},
        });
    } else {
        next();
    }
});
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection:', reason);
    process.exit(1);
});



/**All Route */

app.use('/test', testRouter)
app.use('/api/user', userRoutes)
app.use('/api/admin', adminRoutes)
app.use('/web', controllerRoutes)


app.get("/", (req, res) => res.render("welcome"))
app.get("/test-socket", (req, res) => {
    res.render('socket-template');
})

/**
 * Cron: (1) Send "request near to expire" notification after 3 minutes; (2) delete stale pending requests after 5 minutes.
 * Runs every minute.
 */
const NEAR_TIMEOUT_MINUTES = 15; // notify when request is 3 minutes old (2 min left to accept)
let _isCleaningRelationships = false;
const startRelationshipCleanupCron = () => {
    const intervalMs = 60 * 1000; // every minute
    setInterval(async () => {
        if (_isCleaningRelationships) return;
        _isCleaningRelationships = true;
        try {
            const now = Date.now();
            const cutoff5Min = new Date(now - CONNECTION_REQUEST_TIMEOUT_MINUTES * 60 * 1000);
            const cutoff3Min = new Date(now - NEAR_TIMEOUT_MINUTES * 60 * 1000);
            const cutoff4Min = new Date(now - (NEAR_TIMEOUT_MINUTES + 1) * 60 * 1000);

            // 1) Pending requests aged 3–4 minutes: send "near timeout" notification (once per request)
            const nearTimeoutWhere = {
                deletedAt: null,
                createdAt: {
                    [Op.gte]: cutoff4Min,
                    [Op.lt]: cutoff3Min
                },
                [Op.or]: [
                    { user_one_action: USER_RELATIONSHIP_ACTION_ENUM.REQUESTED },
                    { user_two_action: USER_RELATIONSHIP_ACTION_ENUM.REQUESTED }
                ]
            };
            const nearTimeoutList = await db.user_relationships.findAll({
                where: nearTimeoutWhere,
                attributes: ['id', 'user_one_id', 'user_two_id'],
                raw: true
            });
            for (const rel of nearTimeoutList) {
                await UserRelationship.sendNotification(
                    rel.user_one_id,
                    NOTIFICATION_TYPES.relationship_request_near_timeout,
                    'Request expiring soon',
                    'A connection request is about to expire soon. Accept or ignore.',
                    { relationship_id: rel.id }
                );
                // await UserRelationship.sendNotification(
                //     rel.user_two_id,
                //     NOTIFICATION_TYPES.relationship_request_near_timeout,
                //     'Request expiring soon',
                //     'A connection request is about to expire. Accept or ignore it soon.',
                //     { relationship_id: rel.id }
                // );
            }
            if (nearTimeoutList.length > 0) {
                console.log(`Relationship cleanup cron: sent near-timeout notification for ${nearTimeoutList.length} request(s).`);
            }

            // 2) Delete pending requests older than 5 minutes
            const deleteWhere = {
                deletedAt: null,
                createdAt: { [Op.lt]: cutoff5Min },
                [Op.or]: [
                    { user_one_action: USER_RELATIONSHIP_ACTION_ENUM.REQUESTED },
                    { user_two_action: USER_RELATIONSHIP_ACTION_ENUM.REQUESTED }
                ]
            };
            const deletedCount = await db.user_relationships.destroy({ where: deleteWhere });
            if (deletedCount > 0) {
                console.log(`Relationship cleanup cron: deleted ${deletedCount} stale pending relationship(s).`);
            }
        } catch (err) {
            console.error("Relationship cleanup cron error:", err);
        } finally {
            _isCleaningRelationships = false;
        }
    }, intervalMs);
};

/**Server Starting */
const force = process.argv[2] === '--force'
const alter = process.argv[2] === '--alter';
const httpServer = http.createServer(app)
Socket.instance(httpServer)

httpServer.listen(process.env.BACKEND_PORT, () => {
    console.log("Server is running on PORT : ", process.env.BACKEND_PORT)
    sequelize.sync({ force, alter }).then(async () => {
        console.log("Drop and re-sync db.");

        if (force) {
            await FileHandler.makeDirectory(getUserDirectory());

            const obj = [{
                id: 1,
                title: "Super Admin",
                type: ROLES.ADMIN,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 2,
                title: "App User",
                type: ROLES.USER,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            ]
            const record = await user_groups.bulkCreate(obj)
            console.log("User Groups Records Created ! ")


            const admin_data = {
                user_type: ROLES.ADMIN,
                name: "Admin",
                email: "admin@yopmail.com",
                phone: "9876543210",
                username: "admin",
                password: generateHash("test@123"),
                device_type: "web",
                device_token: "123123123"
            }

            const admin_record = await users.create(admin_data)
            console.log("Admin Record Created ! ")


            const pages_data = [
                {
                    title: "Privacy Policy",
                    slug: "privacy-policy",
                    content: "Lorem epsum",
                    url: "",
                    createdAt: new Date()
                },
                {
                    title: "Terms And Conditions",
                    slug: "terms-conditions",
                    content: "Lorem epsum",
                    url: "",
                    createdAt: new Date()
                },
            ]


            await pages.bulkCreate(pages_data);
            console.log("Pages Records Created ! ")

            const setting_data = {
                title: "SEEmLess",
                gst: 0.00,
                platform_fee: 0.00,
                app_store_url: "",
                play_store_url: "",
                trail_days: 7,
                see_radius: 100,
                createdAt: new Date(),
                updatedAt: new Date()
            }

            await settings.create(setting_data);
            console.log("Setting Record Created ! ")

        }

        require("./app/config/validator");
        startRelationshipCleanupCron();
    });

})
