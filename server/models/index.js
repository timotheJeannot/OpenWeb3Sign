const config = require("../config/db.config.js");
const Sequelize = require("sequelize");
const sequelize = new Sequelize(
    config.DB,
    config.USER,
    config.PASSWORD,
    {
        host: config.HOST,
        port: config.PORT,
        dialect: config.dialect,
        operatorsAliases: false,
        logging: false,

        pool: {
            max: config.pool.max,
            min: config.pool.min,
            acquire: config.pool.acquire,
            idle: config.pool.idle
        }
    }
);

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.user = require("./user/user.model.js")(sequelize, Sequelize);
db.key = require("./key/key.model.js")(sequelize, Sequelize);

db.user.hasMany(db.key, {
    foreignKey: "userId",
    onDelete: "cascade",
    hooks: true
});


module.exports = db;