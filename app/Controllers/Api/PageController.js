const _ = require("lodash");
const { validateAll } = require("../../Helper");
const RestController = require("../RestController");
class PageController extends RestController {
    constructor() {
        super('Page'); //this is your model name
        this.resource = "Page"; //this is your resource name
        this.request; //adonis request obj
        this.response; //adonis response obj
        this.params = {}; // this is used for get parameters from url
    }

    /**
     * This function is used for validate restfull request
     * @param $action
     * @param string $slug
     * @return validator response
     */
    async validation(action, slug = '') {
        let validator = [];
        let rules;
        switch (action) {
            case "store":
                rules = {
                    "title": "required",
                    "content": "required"
                }
                validator = await validateAll(this.request.body, rules);
                break;
            case "update":
                rules = {
                    "title": "string",
                    "content": "required|string"
                }
                validator = await validateAll(this.request.body, rules);
                break;
        }
        return validator;
    }

    async getRecordBySlug({request,response}){
        try {
            this.request = request;
            this.response = response;
            const slug = this.request.params.slug;
            let record = await this.modal.getRecordBySlug(slug);
            this.__is_paginate = false;
            return this.sendResponse(200,"Retrieved Successfully",record)
        }
        catch (err) {
            console.log(err);
            return this.sendError(
                "Internal server error. Please try again later.",
                {},
                500
            )
        }
    }
    async getPage({ request, response }) {
        try {
            this.request = request;
            this.response = response;
            const slug = this.request.params.slug;
            let record = await this.modal.getRecordBySlug(slug);
            if (_.isEmpty(record)){
                throw new Error("Record not found")
            }
            this.__is_paginate = false;
            return response.render("page-template",record);
        }catch (err) {
            console.log(err);
            return this.sendError(
                err.message,
                {},
                500
            )
        }
    }


}
module.exports = PageController;
