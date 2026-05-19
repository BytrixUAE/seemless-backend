
module.exports = (sequelize, Sequelize) => {

    const ReportReason = sequelize.define("report_reasons", {
        id: {
            type: Sequelize.INTEGER.UNSIGNED,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },
    reason: {
            type: Sequelize.STRING(100),
            
            allowNull: false
        },
    description: {
            type: Sequelize.TEXT,
            allowNull: true
        },
    is_active: {
            type: Sequelize.INTEGER,
            defaultValue: 1,
            allowNull: true
        },
    createdAt: {
            type: Sequelize.DATE,
            // field: 'created_at',
            defaultValue: Sequelize.NOW,
            allowNull: true
        },
    updatedAt: {
            type: Sequelize.DATE,
            // field: 'updated_at',
            defaultValue: Sequelize.NOW,
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

    return ReportReason;
};
  