const Sequelize = require("sequelize");

/**
 * Actions summary:
 *
 * changeColumn(mediaHash) => "Kiosks"
 *
 */

const info = {
  revision: 2,
  name: "noname",
  created: "2023-01-26T16:06:16.759Z",
  comment: "",
};

const migrationCommands = (transaction) => [
  {
    fn: "changeColumn",
    params: [
      "Kiosks",
      "mediaHash",
      {
        type: Sequelize.STRING(255),
        field: "mediaHash",
        comment: "Хэш медиа",
        unique: false,
        allowNull: true,
      },
      { transaction },
    ],
  },
];

const rollbackCommands = (transaction) => [
  {
    fn: "changeColumn",
    params: [
      "Kiosks",
      "mediaHash",
      {
        type: Sequelize.STRING(255),
        field: "mediaHash",
        comment: "Хэш медиа",
        unique: false,
        allowNull: false,
      },
      { transaction },
    ],
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
