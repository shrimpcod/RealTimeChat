const knex = require('knex');
const knexConfig = require('../knexfile')

const environment = process.env.NODE_ENV || 'development';
const configForCurrentEnv = knexConfig[environment];

if(!configForCurrentEnv){
    console.error(`Knex configuration for environment '${environment}' not found in knexfile.js`)
    process.exit(1);
}

const dbInstance = knex(configForCurrentEnv);

module.exports = dbInstance;
