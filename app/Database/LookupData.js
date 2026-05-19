
module.exports = (sequelize, Sequelize) => {

    const LookupData = sequelize.define("lookup_data", {
        id: {
            type: Sequelize.INTEGER.UNSIGNED,
            primaryKey: true,
            autoIncrement: true
        },
        lookup_id: {
            type: Sequelize.INTEGER.UNSIGNED,
            allowNull: false,
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
            references: {
                model: require("./Lookup")(sequelize, Sequelize),
                key: 'id'
            }
        },
        title: {
            type: Sequelize.STRING(100),
            allowNull: false
        },
        deletedAt: {
            type: Sequelize.DATE,
            allowNull: true
        }
    }, {
        onDelete: 'cascade',
    });

    return LookupData;
}