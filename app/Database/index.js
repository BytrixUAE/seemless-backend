const dbConfig = require("../config/db.js");

const ChatAssociation = require("./Associations/ChatAssociation");
const LookUpAssociation = require("./Associations/LookUpAssociation");
const UserAssociation = require("./Associations/UserAssociation");
const NotificationAssociation = require("./Associations/NotificationAssociation");
const AttachmentAssociation = require("./Associations/AttachmentAssociation");
const SubscriberAssociation = require("./Associations/SubscriberAssociation");
const Sequelize = require("sequelize");
const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
    host: dbConfig.HOST,
    port: dbConfig.PORT,
    dialect: dbConfig.DIALECT,
    define: dbConfig.DIALECT_OPTIONS,
    operatorsAliases: 0,
    logging: process.env.APP_ENV == "production" ? false : true,
    pool: {
        max: dbConfig.pool.max,
        min: dbConfig.pool.min,
        acquire: dbConfig.pool.acquire,
        idle: dbConfig.pool.idle
    }
});

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;
db.Op = Sequelize.Op;
db.QueryTypes = Sequelize.QueryTypes;


/**Import All Models */
db.user_groups = require("./UserGroups.js")(sequelize, Sequelize);
db.users = require("./User.js")(sequelize, Sequelize);
db.user_api_tokens = require("./UserApiTokens.js")(sequelize, Sequelize);
db.user_otp = require("./UserOTP.js")(sequelize, Sequelize);
db.social_user = require("./SocialUser.js")(sequelize, Sequelize);
db.reset_passwords = require("./ResetPasswords.js")(sequelize, Sequelize);

db.settings = require("./Setting.js")(sequelize, Sequelize);
db.lookups = require("./Lookup.js")(sequelize, Sequelize);
db.lookup_data = require("./LookupData.js")(sequelize, Sequelize);
db.pages = require("./Page.js")(sequelize, Sequelize);
db.notifications = require("./Notification.js")(sequelize, Sequelize);
db.app_updates = require("./AppUpdate.js")(sequelize, Sequelize);

/* chat room models */
db.chat_rooms = require('./ChatRooms.js')(sequelize, Sequelize)
db.chat_room_users = require('./ChatRoomUsers.js')(sequelize, Sequelize)
db.chat_messages = require('./ChatMessages.js')(sequelize, Sequelize)
db.chat_message_status = require('./ChatMessageStatus.js')(sequelize, Sequelize)
db.user_social_accounts = require("./UserSocialAccount.js")(sequelize, Sequelize);
db.subscription_packages = require("./SubscriptionPackage.js")(sequelize, Sequelize);
db.subscriptions = require("./Subscription.js")(sequelize, Sequelize);
db.subscription_transactions = require("./SubscriptionTransaction.js")(sequelize, Sequelize);
db.stripe_webhooks = require("./StripeWebhook.js")(sequelize, Sequelize);
db.subscribers = require("./Subscriber.js")(sequelize, Sequelize);
db.webhook_logs = require("./WebhookLog.js")(sequelize, Sequelize);
db.user_subscription_events = require("./UserSubscriptionEvent.js")(sequelize, Sequelize);
db.user_blocks = require("./UserBlock.js")(sequelize, Sequelize);
db.user_relationships = require("./UserRelationship.js")(sequelize, Sequelize);

db.report_reasons = require("./ReportReason.js")(sequelize, Sequelize);
db.support_tickets = require("./supportTicket.js")(sequelize, Sequelize);
db.user_reports = require("./UserReport.js")(sequelize, Sequelize);
db.attachments = require("./Attachment.js")(sequelize, Sequelize);
db.hobbies = require("./Hobby.js")(sequelize, Sequelize);    
db.user_hobbies = require("./UserHobby.js")(sequelize, Sequelize);

/* Associations */
UserAssociation(db);
LookUpAssociation(db);
ChatAssociation(db);
NotificationAssociation(db);
AttachmentAssociation(db);
SubscriberAssociation(db);


module.exports = db;