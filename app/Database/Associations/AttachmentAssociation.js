module.exports = (db) => {
    /*Attachment User Relations */
    // User who created/owns the attachment
    db.users.hasMany(db.attachments, { 
        foreignKey: "user_id", 
        sourceKey: 'id', 
        as: "UserAttachments" 
    });
    db.attachments.belongsTo(db.users, {
        foreignKey: "user_id",
        targetKey: 'id',
        as: 'User'
    }, {
        onDelete: 'cascade',
        onUpdate: 'cascade'
    });

    /*Attachment Instance Relations - Polymorphic Associations */
    // Instance Type: USERS (10) - Attachments belonging to a user instance
    db.users.hasMany(db.attachments, { 
        foreignKey: "instance_id", 
        sourceKey: 'id', 
        as: "UserInstanceAttachments"
    });
    db.attachments.belongsTo(db.users, {
        foreignKey: "instance_id",
        targetKey: 'id',
        as: 'UserInstance',
        constraints: false // Polymorphic association - no foreign key constraint
    });

    // Instance Type: RELATIONSHIP (20) - Attachments belonging to a user relationship
    db.user_relationships.hasMany(db.attachments, { 
        foreignKey: "instance_id", 
        sourceKey: 'id', 
        as: "RelationshipAttachments"
    });
    db.attachments.belongsTo(db.user_relationships, {
        foreignKey: "instance_id",
        targetKey: 'id',
        as: 'RelationshipInstance',
        constraints: false // Polymorphic association - no foreign key constraint
    });

    // Instance Type: USER_REPORT (30) - Attachments belonging to a user report
    db.user_reports.hasMany(db.attachments, { 
        foreignKey: "instance_id", 
        sourceKey: 'id', 
        as: "UserReportAttachments"
    });
    db.attachments.belongsTo(db.user_reports, {
        foreignKey: "instance_id",
        targetKey: 'id',
        as: 'UserReportInstance',
        constraints: false // Polymorphic association - no foreign key constraint
    });

    // Instance Type: SUPPORT_TICKET (40) - Attachments belonging to a support ticket
    db.support_tickets.hasMany(db.attachments, { 
        foreignKey: "instance_id", 
        sourceKey: 'id', 
        as: "SupportTicketAttachments"
    });
    db.attachments.belongsTo(db.support_tickets, {
        foreignKey: "instance_id",
        targetKey: 'id',
        as: 'SupportTicketInstance',
        constraints: false // Polymorphic association - no foreign key constraint
    });

    // Instance Type: REPORT_REASON (50) - Attachments belonging to a report reason
    db.report_reasons.hasMany(db.attachments, { 
        foreignKey: "instance_id", 
        sourceKey: 'id', 
        as: "ReportReasonAttachments"
    });
    db.attachments.belongsTo(db.report_reasons, {
        foreignKey: "instance_id",
        targetKey: 'id',
        as: 'ReportReasonInstance',
        constraints: false // Polymorphic association - no foreign key constraint
    });
}

