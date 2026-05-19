module.exports = (sequelize, Sequelize) => {
    const Page = sequelize.define("pages", {
        id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
        },
        title: {
            type: Sequelize.STRING(200),
            allowNull: false,
            unique: 'title', // Unique constraint named 'title'
        },
        slug: {
            type: Sequelize.STRING(200),
            allowNull: false,
            unique: 'slug', // Unique constraint named 'slug'
        },
        content: {
            type: Sequelize.TEXT('long'),
            allowNull: false,
        },
        url: {
            type: Sequelize.TEXT,
            allowNull: true
        },
        createdAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.NOW,
        },
        updatedAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.NOW,
        },
        deletedAt: {
            type: Sequelize.DATE,
            allowNull: true,
        },
    }, {
        timestamps: true,
        paranoid: true
    });

    return Page;
};
