const { LOGIN_TYPE, GENDER_ENUM } = require("../config/enum.js");
const { RADIUS_UNIT_ENUM } = require("../config/enum.js");
module.exports = (sequelize, Sequelize) => {

    const User = sequelize.define("users", {
        id: {
            type: Sequelize.INTEGER.UNSIGNED,
            primaryKey: true,
            autoIncrement: true
        },
        uuid: {
            type: Sequelize.UUID,
            allowNull: false,
            defaultValue: Sequelize.UUIDV4,
            unique: true,
        },
        user_type: {
            type: Sequelize.STRING(50),
            allowNull: false,
            references: {
                model: require("./UserGroups.js")(sequelize, Sequelize),
                key: 'type'
            },
        },
        name: {
            type: Sequelize.STRING(200),
            allowNull: true
        },
        username: {
            type: Sequelize.STRING(100),
            allowNull: true
        },
        firstname: {
            type: Sequelize.STRING(100),
            allowNull: true
        },
        lastname: {
            type: Sequelize.STRING(100),
            allowNull: true
        },
        email: {
            type: Sequelize.STRING(100),
            allowNull: true,
        },
        mobile_no: {
            type: Sequelize.STRING(15),
            allowNull: true,
        },
        password: {
            type: Sequelize.STRING,
            allowNull: false,
        },
        image_url: {
            type: Sequelize.STRING,
            allowNull: true,
        },
        blured_image_url: {
            type: Sequelize.STRING,
            allowNull: true,
        },
        is_special: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        status: {
            type: Sequelize.BOOLEAN,
            defaultValue: true,

        },
        is_email_verify: {
            type: Sequelize.BOOLEAN,
            defaultValue: false,
        },
        email_verifyAt: {
            type: Sequelize.DATE,
            allowNull: true
        },
        is_mobile_verify: {
            type: Sequelize.BOOLEAN,
            defaultValue: false,

        },
        mobile_verifyAt: {
            type: Sequelize.DATE,
            allowNull: true
        },
        dob: {
            type: Sequelize.DATE,
            allowNull: true
        },
        star_name: {
            type: Sequelize.STRING(100),
            allowNull: true
        },
        gender: {
            type: Sequelize.INTEGER.UNSIGNED,
            allowNull: true,
            // defaultValue: GENDER_ENUM.MALE,
        },
        is_visible: {
            type: Sequelize.BOOLEAN,
            defaultValue: true,
        },
        current_location: {
            type: Sequelize.STRING(500),
            allowNull: true,
        },
        current_longitude: {
            type: Sequelize.FLOAT,
            allowNull: true,
        },
        current_latitude: {
            type: Sequelize.FLOAT,
            allowNull: true,
        },
        radius_unit: {
            type: Sequelize.STRING(20),
            defaultValue: RADIUS_UNIT_ENUM.FEET,
            allowNull: true,
        },
        login_type: {
            type: Sequelize.STRING(30),
            defaultValue: LOGIN_TYPE.CUSTOM,
            allowNull: true,
        },
        platform_type: {
            type: Sequelize.STRING(100),
            allowNull: true,
        },
        platform_id: {
            type: Sequelize.TEXT,
            allowNull: true,
        },
        is_activated: {
            type: Sequelize.BOOLEAN,
            defaultValue: true,
        },
        is_blocked: {
            type: Sequelize.BOOLEAN,
            defaultValue: false,
        },
        block_reason: {
            type: Sequelize.STRING(500),
            allowNull: true,
        },
        push_notification: {
            type: Sequelize.BOOLEAN,
            defaultValue: true,
        },
        trail_expired_at: {
            type: Sequelize.DATE,
            allowNull: true
        },
        stripe_customer_id: {
            type: Sequelize.STRING(255),
            allowNull: true,
        },
        deletedAt: {
            type: Sequelize.DATE,
            allowNull: true
        }
    });

    return User;
}
