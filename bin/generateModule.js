#!/usr/bin/env node
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Sequelize } = require('sequelize');
const _ = require("lodash")

// Initialize Sequelize
const dbConfig = require("../app/config/db.js");

const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
    host: dbConfig.HOST,
    port: dbConfig.PORT,
    dialect: dbConfig.DIALECT,
    operatorsAliases: 0,

    pool: {
        max: dbConfig.pool.max,
        min: dbConfig.pool.min,
        acquire: dbConfig.pool.acquire,
        idle: dbConfig.pool.idle
    }
});

// Function to fetch columns from a table
const getTableSchema = async (tableName) => {
    try {
        // Get columns
        const [columns] = await sequelize.query(`SHOW COLUMNS FROM ${tableName}`);
        // Get foreign keys with reference details
        const [foreignKeys] = await sequelize.query(`SELECT
        COLUMN_NAME,
            REFERENCED_TABLE_NAME,
            REFERENCED_COLUMN_NAME
        FROM
        INFORMATION_SCHEMA.KEY_COLUMN_USAGE
        WHERE
        TABLE_NAME = '${tableName}'
        AND TABLE_SCHEMA = '${dbConfig.DB}'
        AND REFERENCED_TABLE_NAME IS NOT NULL;`);


        // Map foreign keys by column name
        const fkMap = Object.fromEntries(foreignKeys.map(fk => [fk.COLUMN_NAME, fk]));

        // Merge foreign key info into columns
        const enriched = columns.map(col => {
            const ref = fkMap[col.Field];
            if (ref) {
                col.ReferencedTable = ref.REFERENCED_TABLE_NAME;
                col.ReferencedColumn = ref.REFERENCED_COLUMN_NAME;
                col.onUpdate = ref.UPDATE_RULE;
                col.onDelete = ref.DELETE_RULE;
            }
            return col;
        });

        return enriched;
    } catch (err) {
        console.error('Error fetching table schema:', err);
        process.exit(1);
    }
};

const generateModule = async (moduleName, tableName) => {
    const columns = await getTableSchema(tableName);
    if (!columns) return;
    await generateDatabaseFile(moduleName, tableName,columns);
    await generateModelFile(moduleName, tableName,columns);
    await generateControllerFile(moduleName, columns);
    await generateResourceFile(moduleName, columns);
    await generateRoutes(moduleName);
    console.info("Module Generate Successfully")
    process.exit(1);
}

const generateDatabaseFile = async (moduleName, tableName,columns) => {
    const fields = columns.map((col) => {
        const primaryKey = col.Key === 'PRI' ? 'primaryKey: true,' : '';
        const autoIncrement = col.Extra.includes('auto_increment') ? 'autoIncrement: true,' : '';
        const unique = col.Key === 'UNI' ? 'unique: true,' : '';
        const defaultValue = col.Default ? col.Default === 'CURRENT_TIMESTAMP' ? 'defaultValue: Sequelize.NOW,' : "defaultValue: "+col.Default+"," : "";
        const reference = col.ReferencedTable ? `
        references: {
            model: '${col.ReferencedTable}',
            key: '${col.ReferencedColumn || 'id'}'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
        ` : '';
        return `
        ${col.Field}: {
            type: Sequelize.${mapDataType(col.Type)},
            ${[primaryKey, autoIncrement, unique,defaultValue, reference].filter(Boolean).join('\n            ')}
            allowNull: ${col.Null === 'YES'}
        }`.trim();
    }).join(',\n    ');

    const modelTemplate = `
module.exports = (sequelize, Sequelize) => {

    const ${moduleName} = sequelize.define("${tableName}", {
        ${fields}
    }, {
        timestamps: true,
        paranoid: true,
    });

    return ${moduleName};
};
  `;

    const modelPath = path.join(process.cwd(), 'app','Database', `${moduleName}.js`);
    fs.writeFileSync(modelPath, modelTemplate, { encoding: 'utf8' });
    /* Import Database file in index.js  */
    const mainFilePath = path.join(process.cwd(),"app","Database", 'index.js');

    const importTemplate = `
    
    db.${tableName} = require("./${moduleName}.js")(sequelize, Sequelize);
`;

    // Append to the Database/index.js file
    fs.appendFileSync(mainFilePath, importTemplate, { encoding: 'utf8' });

    console.info(`${moduleName}.js Database File created successfully!`);
};
const generateModelFile = async (moduleName, tableName,columns) => {
    const notUpdateColumns = ['id','createdAt'];
    const fields = columns.map((column)=>{return column.Field});
    const modelTemplate = `
const _ = require("lodash");
const RestModel = require("./RestModel"); 

class ${moduleName} extends RestModel {

    constructor() {
        super("${tableName}");
    }

    softdelete() {
        return true;
    }
    
    includeShow(){
        return [];
    }
    
    includeIndex(){
        return [];
    }
    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    getFields() {
        return [${(fields.filter(item => !notUpdateColumns.includes(item))).map(item => `"${item}"`).join(', ')}];
    }

    showColumns() {
        return [${fields.map(item => `"${item}"`).join(', ')}];
    }

    exceptUpdateField() {
        return [${fields.map(item => `"${item}"`).join(', ')}];
    }
    
    /**
     * Hook for manipulate query of index result
     * @param {current mongo query} query
     * @param {adonis request object} request
     * @param {object} slug
     */
    async indexQueryHook(query, request, slug = {}) {
        query.include = this.includeIndex();
    }
    async singleQueryHook(query, request, id){
        query.include = this.includeShow();
    }
    async beforeCreateHook(request, params) {
   
    }
    async beforeEditHook(request, params, slug) {
        let exceptUpdateField = this.exceptUpdateField();
        exceptUpdateField.filter(exceptField => {
            delete params[exceptField];
        });
    }
    async beforeEditHook(request, params, slug) {
   
    }

}

module.exports = ${moduleName};
  `;

    const modelPath = path.join(process.cwd(),'app', 'Models', `${moduleName}.js`);
    fs.writeFileSync(modelPath, modelTemplate, { encoding: 'utf8' });
    console.info(`${moduleName}.js model created successfully!`);
}
const generateControllerFile = async (moduleName, columns) => {
    const notRequiredColumns = ['id','status','createdAt','updatedAt','deletedAt'];
    const validator = columns.map(col => {
        if (!notRequiredColumns.includes(col.Field)){
            return `"${col.Field}": "required"`;
        }
        return null;
    }).filter(Boolean).join(',\n            ');
    const controllerTemplate = `
const { validateAll } = require("../../Helper");
const RestController = require("../RestController");

class ${moduleName + "Controller"} extends RestController {
  constructor() {
    super('${moduleName}');
    this.resource = "${moduleName}";
    this.request; 
    this.response;
    this.params = {};
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
          ${validator}
        }
        validator = await validateAll(this.request.body, rules)
        break;
      case "update":
        rules = {
           ${validator}
        }
        validator = await validateAll(this.request.body, rules);
        break;
    }
    return validator;
  }

  /**
   * This function loads before a model load
   * @param {adonis request object} this.request
   * @param {adonis response object} this.response
   */
  async beforeIndexLoadModel() {

  }

  /**
   * This function loads before response send to client
   * @param {adonis request object} this.request
   * @param {adonis response object} this.response
   */
  async afterIndexLoadModel() {

  }

  /**
   * This function loads before a model load
   * @param {adonis request object} this.request
   * @param {adonis response object} this.response
   */
  async beforeStoreLoadModel() {

  }

  /**
   * This function loads before response send to client
   * @param {object} record
   * @param {adonis request object} this.request
   * @param {adonis response object} this.response
   */
  async afterStoreLoadModel(record) {

  }

  /**
    * This function loads before a model load
    * @param {adonis request object} this.request
    * @param {adonis response object} this.response
    * @param {adonis param object} this.params
    */
  async beforeShowLoadModel() {

  }

  /**
   * This function loads before response send to client
   * @param {object} record
   * @param {adonis request object} this.request
   * @param {adonis response object} this.response
   * @param {adonis param object} this.params
   */
  async afterShowLoadModel(record) {

  }

  /**
   * This function loads before a model load
   * @param {adonis request object} this.request
   * @param {adonis response object} this.response
   * @param {adonis param object} this.params
   */
  async beforeUpdateLoadModel() {

  }

  /**
    * This function loads before response send to client
    * @param {object} record
    * @param {adonis request object} this.request
    * @param {adonis response object} this.response
    * @param {adonis param object} this.params
    */
  async afterUpdateLoadModel(record) {

  }

  /**
   * This function loads before a model load
   * @param {adonis request object} this.request
   * @param {adonis response object} this.response
   * @param {adonis param object} this.params
   */
  async beforeDestroyLoadModel() {

  }

  /**
   * This function loads before response send to client
   * @param {object} record
   * @param {adonis request object} this.request
   * @param {adonis response object} this.response
   * @param {adonis param object} this.params
   */
  async afterDestoryLoadModel() {

  }

}
module.exports = ${moduleName + "Controller"};`

    const filePath = path.join(process.cwd(),'app', 'Controllers','Api', `${moduleName+"Controller"}.js`);
    fs.writeFileSync(filePath, controllerTemplate, { encoding: 'utf8' });
    console.info(`${moduleName}.js controller created successfully!`);
}
const generateResourceFile = async (moduleName, columns) => {
    const jsonSchemaFields = columns.map(col => {
        return `"${col.Field}": record.${col.Field}`;
    }).join(',\n            ');
    const resourceTemplate = `
    const _ = require("lodash")

class ${moduleName} {

    static async initResponse(data, request) {
        if (_.isEmpty(data))
            return data;

        let response;
        if (Array.isArray(data)) {
            response = []
            for (var i = 0; i < data.length; i++) {
                response.push(this.jsonSchema(data[i], request));
            }
        } else {
            response = this.jsonSchema(data, request)
        }
        return response;

    }


    static jsonSchema(record, request) {
        return {
            ${jsonSchemaFields}
        }
    }
}

module.exports = ${moduleName};`

    const filePath = path.join(process.cwd(),'app', 'Controllers','Resource', `${moduleName}.js`);
    fs.writeFileSync(filePath, resourceTemplate, { encoding: 'utf8' });
    console.info(`${moduleName}.js resource created successfully!`);
}
const generateRoutes = async (moduleName) => {
    const routesPath = path.join(process.cwd(),"app","routes", 'User.js');

    const routesTemplate = `
    
const ${moduleName}Controller = require("../Controllers/Api/${moduleName}Controller");
/*---------------------------------- ${moduleName} ROUTES ------------------------------*/
router.get("/${_.kebabCase(moduleName)}", apiAuthentication, (req, res) => (new ${moduleName}Controller()).index({ request: req, response: res }))
router.get("/${_.kebabCase(moduleName)}/:id", apiAuthentication, (req, res) => (new ${moduleName}Controller()).show({ request: req, response: res }))
router.post("/${_.kebabCase(moduleName)}", apiAuthentication, (req, res) => (new ${moduleName}Controller()).store({ request: req, response: res }))
router.patch("/${_.kebabCase(moduleName)}/:id", apiAuthentication, (req, res) => (new ${moduleName}Controller()).update({ request: req, response: res }))
router.delete("/${_.kebabCase(moduleName)}/:id", apiAuthentication, (req, res) => (new ${moduleName}Controller()).destroy({ request: req, response: res }))
`;

    // Append to the routes.js file
    fs.appendFileSync(routesPath, routesTemplate, { encoding: 'utf8' });
    console.info(`CRUD routes for ${moduleName} added to User.js successfully!`);
}

// Function to map SQL data types to Sequelize data types
const mapDataType = (sqlType) => {
    if (sqlType.includes('int')) {
        return sqlType.includes('unsigned') ? 'INTEGER.UNSIGNED' : 'INTEGER';
    }
    if (sqlType.includes('bigint')) {
        return sqlType.includes('unsigned') ? 'BIGINT.UNSIGNED' : 'BIGINT';
    }
    if (sqlType.includes('smallint')) {
        return sqlType.includes('unsigned') ? 'SMALLINT.UNSIGNED' : 'SMALLINT';
    }
    if (sqlType.includes('mediumint')) {
        return sqlType.includes('unsigned') ? 'MEDIUMINT.UNSIGNED' : 'MEDIUMINT';
    }
    if (sqlType.includes('varchar')) {
        const length = sqlType.match(/\((.*?)\)/)[1];
        return `STRING(${length})`;
    }
    if (sqlType.includes('text')) return 'TEXT';
    if (sqlType.includes('longtext')) return 'LONGTEXT';
    if (sqlType.includes('char')) {
        const length = sqlType.match(/\((.*?)\)/)[1];
        return `CHAR(${length})`;
    }
    if (sqlType.includes('binary')) {
        const length = sqlType.match(/\((.*?)\)/)[1];
        return `BINARY(${length})`;
    }
    if (sqlType.includes('varbinary')) {
        const length = sqlType.match(/\((.*?)\)/)[1];
        return `BLOB(${length})`; // Sequelize doesn't have VARBINARY, using BLOB as the closest type
    }
    if (sqlType.includes('date')) return 'DATE';
    if (sqlType.includes('datetime')) return 'DATE';
    if (sqlType.includes('timestamp')) return 'DATE';
    if (sqlType.includes('time')) return 'TIME';
    if (sqlType.includes('decimal')) {
        const match = sqlType.match(/\((\d+),\s*(\d+)\)/);
        return match ? `DECIMAL(${match[1]}, ${match[2]})` : 'DECIMAL';
    }
    if (sqlType.includes('float')) {
        const match = sqlType.match(/\((.*?)\)/);
        return match ? `FLOAT(${match[1]})` : 'FLOAT(20,2)';
    }
    if (sqlType.includes('double')) {
        const match = sqlType.match(/\((.*?)\)/);
        return match ? `DOUBLE(${match[1]})` : 'DOUBLE(20,2)';
    }
    if (sqlType.includes('enum')) {
        const values = sqlType.match(/\((.*?)\)/)[1].split(',').map(v => v.trim().replace(/'/g, ''));
        return `ENUM(${values.join(', ')})`;
    }
    if (sqlType.includes('set')) {
        const values = sqlType.match(/\((.*?)\)/)[1].split(',').map(v => v.trim().replace(/'/g, ''));
        return `SET(${values.join(', ')})`;
    }

    return 'STRING'; // Default fallback type
};

// Handle command-line arguments
const args = process.argv.slice(2);
if (args.length !== 2) {
    console.error('Usage: generate-module <ModuleName> <TableName>');
    process.exit(1);
}

const moduleName = args[0];
const tableName = args[1];

generateModule(moduleName, tableName);