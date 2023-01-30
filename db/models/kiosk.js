const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Kiosk extends Model {
    static associate(models) {
    }
  }

  Kiosk.init(
    {
      hash: { type: DataTypes.STRING(255), allowNull: false, unique: true, comment: 'Хэш киоска' },
      name: { type: DataTypes.STRING(255), allowNull: false, unique: true, comment: 'Имя кисока' },
      mediaHash: { type: DataTypes.STRING(255), allowNull: true, unique: false, comment: 'Хэш медиа' },
    },
    {
      sequelize,
      modelName: 'Kiosk',
    },
  );

  return Kiosk;
};
