



module.exports = (sequelize, Sequelize) => {

    const User_Groups = sequelize.define("user_groups", {
        id: {
            type: Sequelize.INTEGER.UNSIGNED,
            primaryKey: true,
            autoIncrement: true
        },
        title: {
            type: Sequelize.STRING(50),
            allowNull: false,
        },
        type: {
            type: Sequelize.STRING(50),
            allowNull: true,
            unique: true,
        },
        deletedAt: {
            type: Sequelize.DATE,
            allowNull: true
        }
    }, {
        onDelete: 'cascade',
    });

    return User_Groups;
}