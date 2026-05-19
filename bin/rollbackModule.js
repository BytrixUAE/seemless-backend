#!/usr/bin/env node
const fs = require('fs');
const path = require('path');


const rollbackModule = async (moduleName) => {
    const databasePath = path.join(process.cwd(),'app', 'Database', `${moduleName}.js`);
    const modelPath = path.join(process.cwd(),'app', 'Models', `${moduleName}.js`);
    const controllerPath = path.join(process.cwd(),'app', 'Controllers','Api', `${moduleName}Controller.js`);
    const resourcePath = path.join(process.cwd(),'app', 'Controllers','Resource', `${moduleName}.js`);

    const filesToDelete = [databasePath, modelPath, controllerPath, resourcePath];

    // Rollback function to delete files
    filesToDelete.forEach(file => {
        if (fs.existsSync(file)) {
            fs.unlinkSync(file);  // Synchronously delete the file
            console.log(`${file} deleted.`);
        } else {
            console.log(`${file} does not exist.`);
        }
    });
    console.info("Module Rollback Successfully")
    console.info("Remove imports from Database/index.js and routes/User.js")
    process.exit(1);
}


// Handle command-line arguments
const args = process.argv.slice(2);
if (args.length !== 1) {
    console.error('Usage: rollback-module <ModuleName>');
    process.exit(1);
}

const moduleName = args[0];


rollbackModule(moduleName);