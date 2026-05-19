const Validator = require('validatorjs');
const dbContainer = require("../Database/index");
const _ = require('lodash');
const { getSplitCharacter } = require('../Helper');
const { Op } = dbContainer;

Validator.registerAsync('unique', async function (value, attribute, req, passes) {
    const parts = attribute.split(",").map(p => p.trim());
    const [table, col] = parts;
    const model = dbContainer[table];

    const where = { [col]: value, deletedAt: null };
    // optional: unique:table,col,idColumn,idValue — exclude row with idColumn = idValue (e.g. current user on update)
    if (parts.length >= 4) {
        const idColumn = parts[2];
        let idValue = parts[3];
        if (idValue !== '' && idValue != null && !isNaN(Number(idValue))) idValue = Number(idValue);
        where[idColumn] = { [Op.ne]: idValue };
    }

    const record = await model.count({ where });
    if (record > 0) {
        passes(false, `This ${col} is already registered.`);
    } else {
        passes();
    }
});

Validator.registerAsync('exists', async function (value, attribute, req, passes) {
    console.log(value, attribute)
    const [table, col] = attribute.split(",");
    console.log(value)
    const model = dbContainer[table];

    const count = await model.count({ where: { [col]: value, deletedAt: null } });
    if (!count) {
        passes(false, `The ${col} is invalid.`);
    }
    else {
        passes();
    }

});

Validator.register('array_string', (value) => {
    return Array.isArray(value) && value.every(item => _.isString(item))

},
    ':attribute should be list of string.');

Validator.register('notContainSpecialCharacter', (value) => {
    if (Array.isArray(value)) {
        return value.every(item => !item.includes(getSplitCharacter()))
    }
    else {
        return !value.includes(getSplitCharacter())
    }

},
    ':attribute should not contain special character.');


Validator.register('float', (val) => {
    var floatRegex = /^-?\d+(?:[.,]\d*?)?$/;
    if (!floatRegex.test(val))
        return false;

    val = parseFloat(val);
    console.log(val)
    if (isNaN(val) || !(typeof val == 'number'))
        return false;
    return true;

},
    ':attribute must be a float value.');

