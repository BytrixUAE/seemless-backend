#!/usr/bin/env node
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

const envFilePath = path.resolve(process.cwd(), '.env');

function setEnvValue(key, value) {
    // Read the current .env file (create if it doesn't exist)
    const envContent = fs.existsSync(envFilePath) ? fs.readFileSync(envFilePath, 'utf-8') : '';

    // Regular expression to find the key
    const keyRegex = new RegExp(`^${key}=.*`, 'm');

    // If the key already exists, replace the value; otherwise, append it
    let updatedEnv;
    if (keyRegex.test(envContent)) {
        updatedEnv = envContent.replace(keyRegex, `${key}="${value}"`);
    } else {
        updatedEnv = `${envContent}\n${key}="${value}"`; // Add a new line with the key-value pair
    }

    // Write the updated content back to the .env file
    fs.writeFileSync(envFilePath, updatedEnv.trim());
}
const generateClient = async () => {
    let clientId = uuidv4();
    setEnvValue("CLIENT_ID",clientId)
    console.info("Client ID generated Successfully")
    process.exit(1);
}



generateClient();