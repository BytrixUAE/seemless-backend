const _ = require("lodash");
const { v4: uuidv4 } = require("uuid");
const RestModel = require("./RestModel");

class Page extends RestModel {
    constructor() {
        super("pages");
    }

    getFields() {
        return ["slug","content","title","url", "createdAt"];
    }

    showColumns() {
        return ["id","slug","content","title","url", "createdAt"];
    }

    softdelete() {
        return true;
    }
    async beforeCreateHook(request, params) {
        params.slug = _.kebabCase(params.title)
    }

    async beforeEditHook(request, params) {
        if (params.title){
            params.slug = _.kebabCase(params.title)
        }
    }

    async getRecordBySlug(slug){
        const result = await this.getModel().findOne({
            where:{
                slug: slug
            }
        });
        return result ? result.toJSON() : null;
    }
}

module.exports = Page;
