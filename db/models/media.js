const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Media extends Model {
    static associate(models) {
    }
  }

  Media.init(
    {
      hash: { type: DataTypes.STRING(255), allowNull: false, unique: true, comment: 'Хэш медиа' },
      name: { type: DataTypes.STRING(255), allowNull: false, unique: true, comment: 'Имя медиа' },
      content: { type: DataTypes.STRING(1024), allowNull: false, unique: true, comment: 'Имя файла или текст' },
      type: { type: DataTypes.ENUM('text', 'image', 'video'), allowNull: false, comment: 'Тип медиа' },
    },
    {
      sequelize,
      modelName: 'Media',
    },
  );

  return Media;
};
