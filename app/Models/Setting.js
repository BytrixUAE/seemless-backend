const _ = require("lodash");
const { v4: uuidv4 } = require("uuid");
const RestModel = require("./RestModel");

class Setting extends RestModel {
  constructor() {
    super("settings");
  }

  getFields() {
    return ["title","gst","platform_fee","app_store_url","play_store_url", "trail_days", "see_radius"];
  }

  showColumns() {
    return ["title","gst","platform_fee","app_store_url","play_store_url", "trail_days", "see_radius"];
  }

  exceptUpdateField() {
    return ["id","createdAt"];
  }


  async beforeCreateHook(request, params) {
    params.createdAt = new Date()
  }

  async getLastRecord(){
    const result = await this.getModel().findOne({
      order: [['createdAt', 'DESC']],
    });
    return result ? result.toJSON() : null;
  }
}

module.exports = Setting;
