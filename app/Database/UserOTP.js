
module.exports = (sequelize, Sequelize) => {

    const User_Otp = sequelize.define("user_otp", {
        id: {
            type: Sequelize.INTEGER.UNSIGNED,
            primaryKey: true,
            autoIncrement: true
        },
        mobile_no: {
            type: Sequelize.STRING(15),
            allowNull: true
        },
        email: {
            type: Sequelize.STRING(50),
            allowNull: true
        },
        otp: {
            type: Sequelize.STRING(8),
            allowNull: false
        },
        deletedAt: {
            type: Sequelize.DATE,
            allowNull: true
        }
    }, {
        onDelete: 'cascade',
    });

    return User_Otp;
}