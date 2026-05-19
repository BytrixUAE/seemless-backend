module.exports = (db) => {
    /* user relation */
    db.notifications.belongsTo(db.users, { foreignKey: "user_id", sourceKey: 'id', as: "notification_user" });
}