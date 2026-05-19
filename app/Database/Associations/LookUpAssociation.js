module.exports = (db) => {
    /*Lookup Data Model Relation */
    db.lookups.hasMany(db.lookup_data, { foreignKey: "lookup_id", sourceKey: 'id', as: "LookupData_LookupSlug" });
    db.lookup_data.belongsTo(db.lookups, {
        foreignKey: "lookup_id",
        targetKey: 'id',
        as: "LookupData_LookupSlug"
    }, {
        onDelete: 'cascade',
        onUpdate: 'cascade'
    });
}