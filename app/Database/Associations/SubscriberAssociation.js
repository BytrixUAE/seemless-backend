module.exports = (db) => {
    // subscribers <-> users
    db.subscribers.belongsTo(db.users, { foreignKey: "user_id", sourceKey: "id", as: "subscriber_user" });
    db.users.hasMany(db.subscribers, { foreignKey: "user_id", sourceKey: "id", as: "UserSubscribers" });

    // subscribers <-> subscription_packages
    // db.subscribers.belongsTo(db.subscription_packages, { foreignKey: "package_id", targetKey: "id", as: "SubscriptionPackage" });
    // db.subscription_packages.hasMany(db.subscribers, { foreignKey: "package_id", sourceKey: "id", as: "PackageSubscribers" });

    // user_subscription_events <-> subscribers/users
    db.user_subscription_events.belongsTo(db.subscribers, { foreignKey: "subscriber_id", targetKey: "id", as: "Subscriber" });
    db.user_subscription_events.belongsTo(db.users, { foreignKey: "user_id", targetKey: "id", as: "User" });
};

