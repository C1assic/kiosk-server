const Sequelize = require("sequelize");

/**
 * Actions summary:
 *
 * createTable() => "Kiosks", deps: []
 * createTable() => "Media", deps: []
 *
 */

const info = {
  revision: 1,
  name: "noname",
  created: "2023-01-26T15:53:56.741Z",
  comment: "",
};

const migrationCommands = (transaction) => [
  {
    fn: "createTable",
    params: [
      "Kiosks",
      {
        id: {
          type: Sequelize.INTEGER,
          field: "id",
          autoIncrement: true,
          primaryKey: true,
          allowNull: false,
        },
        hash: {
          type: Sequelize.STRING(255),
          field: "hash",
          comment: "Хэш киоска",
          unique: true,
          allowNull: false,
        },
        name: {
          type: Sequelize.STRING(255),
          field: "name",
          comment: "Имя кисока",
          unique: true,
          allowNull: false,
        },
        mediaHash: {
          type: Sequelize.STRING(255),
          field: "mediaHash",
          comment: "Хэш медиа",
          unique: false,
          allowNull: false,
        },
        createdAt: {
          type: Sequelize.DATE,
          field: "createdAt",
          allowNull: false,
        },
        updatedAt: {
          type: Sequelize.DATE,
          field: "updatedAt",
          allowNull: false,
        },
      },
      { transaction },
    ],
  },
  {
    fn: "createTable",
    params: [
      "Media",
      {
        id: {
          type: Sequelize.INTEGER,
          field: "id",
          autoIncrement: true,
          primaryKey: true,
          allowNull: false,
        },
        hash: {
          type: Sequelize.STRING(255),
          field: "hash",
          comment: "Хэш медиа",
          unique: true,
          allowNull: false,
        },
        name: {
          type: Sequelize.STRING(255),
          field: "name",
          comment: "Имя медиа",
          unique: true,
          allowNull: false,
        },
        content: {
          type: Sequelize.STRING(1024),
          field: "content",
          comment: "Имя файла или текст",
          unique: true,
          allowNull: false,
        },
        type: {
          type: Sequelize.ENUM("text", "image", "video"),
          field: "type",
          comment: "Тип медиа",
          allowNull: false,
        },
        createdAt: {
          type: Sequelize.DATE,
          field: "createdAt",
          allowNull: false,
        },
        updatedAt: {
          type: Sequelize.DATE,
          field: "updatedAt",
          allowNull: false,
        },
      },
      { transaction },
    ],
  },
];

const rollbackCommands = (transaction) => [
  {
    fn: "dropTable",
    params: ["Kiosks", { transaction }],
  },
  {
    fn: "dropTable",
    params: ["Media", { transaction }],
  },
];

const pos = 0;
const useTransaction = true;

const execute = (queryInterface, sequelize, _commands) => {
  let index = pos;
  const run = (transaction) => {
    const commands = _commands(transaction);
    return new Promise((resolve, reject) => {
      const next = () => {
        if (index < commands.length) {
          const command = commands[index];
          console.log(`[#${index}] execute: ${command.fn}`);
          index++;
          queryInterface[command.fn](...command.params).then(next, reject);
        } else resolve();
      };
      next();
    });
  };
  if (useTransaction) return queryInterface.sequelize.transaction(run);
  return run(null);
};

module.exports = {
  pos,
  useTransaction,
  up: (queryInterface, sequelize) =>
    execute(queryInterface, sequelize, migrationCommands),
  down: (queryInterface, sequelize) =>
    execute(queryInterface, sequelize, rollbackCommands),
  info,
};
