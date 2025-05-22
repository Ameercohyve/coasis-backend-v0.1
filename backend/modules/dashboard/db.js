// db.js
require('dotenv').config();
const { Sequelize } = require('sequelize');

// Create a new Sequelize instance
const sequelize = new Sequelize(process.env.MYSQL_DB, process.env.MYSQL_USER, process.env.MYSQL_PASSWORD, {
    host: process.env.MYSQL_HOST,
    dialect: 'mysql'
});

// Test the connection
sequelize.authenticate()
    .then(() => console.log('MySQL connection established successfully.'))
    .catch(err => console.error('Unable to connect to MySQL:', err));

module.exports = sequelize;