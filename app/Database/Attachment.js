
module.exports = (sequelize, Sequelize) => {

    const Attachment = sequelize.define("attachments", {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },
    url: {
            type: Sequelize.STRING(255),
            
            allowNull: false
        },
    user_id: {
            type: Sequelize.INTEGER.UNSIGNED,
            
            allowNull: false
        },
    type: {
            type: Sequelize.INTEGER.UNSIGNED,
            
            allowNull: false
        },
    duration: {
            type: Sequelize.INTEGER.UNSIGNED,
            
            allowNull: true
        },
    thumbnail: {
            type: Sequelize.STRING(255),
            
            allowNull: true
        },
    blur_image: {
            type: Sequelize.STRING(255),
            
            allowNull: true
        },
    instance_type: {
            type: Sequelize.INTEGER.UNSIGNED,
            
            allowNull: false
        },
    instance_id: {
            type: Sequelize.INTEGER.UNSIGNED,
            
            allowNull: false
        },
    status: {
            type: Sequelize.INTEGER,
            defaultValue: 1,
            allowNull: true
        },
    createdAt: {
            type: Sequelize.DATE,
            
            allowNull: true
        },
    updatedAt: {
            type: Sequelize.DATE,
            
            allowNull: true
        },
    deletedAt: {
            type: Sequelize.DATE,
            
            allowNull: true
        }
    }, {
        timestamps: true,
        paranoid: true,
    });

    return Attachment;
};
  