const Sequelize = require("sequelize");

const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: "./database.sqlite3",
  logging: console.log, // Enable query logging

});

class Profile extends Sequelize.Model {}
Profile.init(
  {
    firstName: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    lastName: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    profession: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    balance: {
      type: Sequelize.DECIMAL(12, 2),
    },
    type: {
      type: Sequelize.ENUM("client", "contractor"),
    },
  },
  {
    sequelize,
    modelName: "Profile",
  }
);

class Contract extends Sequelize.Model {}
Contract.init(
  {
    terms: {
      type: Sequelize.TEXT,
      allowNull: false,
    },
    status: {
      type: Sequelize.ENUM("new", "in_progress", "terminated"),
    },
  },
  {
    sequelize,
    modelName: "Contract",
  }
);

class Job extends Sequelize.Model {}
Job.init(
  {
    description: {
      type: Sequelize.TEXT,
      allowNull: false,
    },
    price: {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: false,
    },
    paid: {
      type: Sequelize.BOOLEAN,
      default: false,
    },
    paymentDate: {
      type: Sequelize.DATE,
    },
    ContractorId: {
      // Ensure this field exists
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    ClientId: {
      // Ensure this field exists
      type:Sequelize.INTEGER,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "Job",
  }
);

Profile.hasMany(Contract, { as: "Contractor", foreignKey: "ContractorId" });
Contract.belongsTo(Profile, { as: "Contractor" });

Profile.hasMany(Contract, { as: "Client", foreignKey: "ClientId" });
Contract.belongsTo(Profile, { as: "Client" });

Contract.hasMany(Job);
Job.belongsTo(Contract);

Profile.hasMany(Job, { foreignKey: "ContractorId", as: "JobsAsContractor" });
Job.belongsTo(Profile, { foreignKey: "ContractorId", as: "Contractor" });

Profile.hasMany(Job, { foreignKey: "ClientId", as: "JobsAsClient" });
Job.belongsTo(Profile, { foreignKey: "ClientId", as: "Client" });

module.exports = {
  sequelize,
  Profile,
  Contract,
  Job,
};
