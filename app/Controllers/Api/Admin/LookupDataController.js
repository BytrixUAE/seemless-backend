const _ = require("lodash")

const RestController = require("../../RestController");
const { validateAll } = require("../../../Helper");

class LookupDataController extends RestController {

    constructor() {
        super("LookupData")
        this.resource = 'LookupData';
        this.request;
        this.response;
        this.params = {};
    }

    async validation(action, id = 0) {
        let validator = [];
        let rules;

        switch (action) {
            case "store":
                rules = {
                    title: 'required|string|max:80',
                }
                validator = await validateAll(this.request.body, rules)
                break;

            case "update":
                break;
        }
        return validator;
    }

    async afterStoreLoadModel() {
        this.resource = 'LookupData';
    }

}

module.exports = LookupDataController;