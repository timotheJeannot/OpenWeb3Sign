module.exports = (sequelize, Sequelize) => {
    const Keys = sequelize.define("keys", {
      publicKey: {
        type: Sequelize.TEXT
      },
      certificate : {
        type: Sequelize.TEXT
      },
      method : {
        type: Sequelize.STRING
      }
    });
  
    return Keys;
  };