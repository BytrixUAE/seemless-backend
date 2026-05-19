module.exports = (db) => {
    /**User Api Token Models Relationships Or Assosiaction */
    db.users.hasOne(db.user_api_tokens, { foreignKey: "user_id", sourceKey: 'id', as: "UserApiToken_Slug_Single" });
    db.users.hasMany(db.user_api_tokens, { foreignKey: "user_id", sourceKey: 'id' });
    db.user_api_tokens.belongsTo(db.users, {
        foreignKey: "user_id",
        targetKey: 'id'
    }, {
        onDelete: 'cascade',
        onUpdate: 'cascade'
    });

    db.users.hasOne(db.subscribers, { foreignKey: "user_id", sourceKey: 'id', as: "Subscription" });
    db.users.hasMany(db.subscribers, { foreignKey: "user_id", sourceKey: 'id', as: "Subscriptions" });
    db.subscriptions.belongsTo(db.users, { foreignKey: "user_id", targetKey: 'id', as: "User" });
    db.subscribers.belongsTo(db.subscription_packages, {
        foreignKey: "package_id",
        targetKey: 'id',
        as: "SubscriptionPackage"
    });
    db.subscriptions.hasMany(db.subscription_transactions, { foreignKey: "subscription_id", sourceKey: 'id', as: "SubscriptionTransactions" });
    db.subscription_transactions.belongsTo(db.subscriptions, { foreignKey: "subscription_id", targetKey: 'id', as: "TransactionSubscription" });
    db.users.hasMany(db.subscription_transactions, { foreignKey: "user_id", sourceKey: 'id', as: "SubscriptionTransactions" });
    db.subscription_transactions.belongsTo(db.users, { foreignKey: "user_id", targetKey: 'id', as: "User" });

    db.users.hasMany(db.user_social_accounts, { foreignKey: "user_id", sourceKey: 'id', as: "UserSocialAccounts" });
    
    /*User Relationship Model Relations */
    db.users.hasMany(db.user_relationships, { foreignKey: "user_one_id", sourceKey: 'id', as: "UserOneRelationships" });
    db.users.hasMany(db.user_relationships, { foreignKey: "user_two_id", sourceKey: 'id', as: "UserTwoRelationships" });
    db.user_relationships.belongsTo(db.users, {
        foreignKey: "user_one_id",
        targetKey: 'id',
        as: "UserOne"
    });
    db.user_relationships.belongsTo(db.users, {
        foreignKey: "user_two_id",
        targetKey: 'id',
        as: "UserTwo"
    });
    
    /*User Block Model Relations */
    db.users.hasMany(db.user_blocks, { foreignKey: "user_id", sourceKey: 'id', as: "BlockedUsers" });
    db.users.hasMany(db.user_blocks, { foreignKey: "block_user_id", sourceKey: 'id', as: "BlockedByUsers" });
    db.user_blocks.belongsTo(db.users, {
        foreignKey: "user_id",
        targetKey: 'id',
        as: "User"
    });
    db.user_blocks.belongsTo(db.users, {
        foreignKey: "block_user_id",
        targetKey: 'id',
        as: "BlockedUser"
    });
    
    /*User Groups Model Relation */
    db.user_groups.hasMany(db.users, { foreignKey: "user_type", sourceKey: 'type' });
    db.users.belongsTo(db.user_groups, {
        foreignKey: "user_type",
        targetKey: 'type'
    }, {
        onDelete: 'cascade',
        onUpdate: 'cascade'
    });

    db.users.hasMany(db.user_reports, { foreignKey: "user_id", sourceKey: 'id', as: "UserReports" });
    db.users.hasMany(db.user_reports, { foreignKey: "reported_user_id", sourceKey: 'id', as: "ReportedUsers" });
    db.user_reports.belongsTo(db.users, { foreignKey: "user_id", targetKey: 'id', as: "User" });
    db.user_reports.belongsTo(db.users, { foreignKey: "reported_user_id", targetKey: 'id', as: "ReportedUser" });

    db.users.hasMany(db.support_tickets, { foreignKey: "user_id", sourceKey: 'id', as: "SupportTickets" });
    db.support_tickets.belongsTo(db.users, { foreignKey: "user_id", targetKey: 'id', as: "User" });

    /** User -> Hobbies through user_hobbies (get hobbies according to user_hobbies) */
    db.users.belongsToMany(db.hobbies, {
        through: db.user_hobbies,
        foreignKey: "user_id",
        otherKey: "hobby_id",
        as: "Hobbies"
    });
}