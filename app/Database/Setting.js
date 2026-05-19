module.exports = (sequelize, Sequelize) => {
  const Setting = sequelize.define("settings", {
    id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    title: {
      type: Sequelize.STRING(200),
      allowNull: false,
    },
    gst: {
      type: Sequelize.FLOAT(20, 2),
      allowNull: false,
    },
    see_radius: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 100,
    },
    trail_days: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 7,
    },
    platform_fee: {
      type: Sequelize.FLOAT(20, 2),
      allowNull: false,
      defaultValue: 0.00,
    },
    app_store_url: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    play_store_url: {
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
    timestamps: true, // Automatically adds `createdAt` and `updatedAt` fields
    paranoid: true, // Enables `deletedAt` for soft deletes
  });

  return Setting;
};
