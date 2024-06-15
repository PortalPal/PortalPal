"use strict";

const { accountsModel, userModel } = require("../../src/db.js");

module.exports = {
  name: "stats",
  description: "Return information about the bot.",
  execute: async (interaction, args) => {
    let embed = {
      title: "",
      timestamp: new Date(),
      color: 10181046,
      description: `# PortalPal Information

      ## Database Information
      Total Invitable Accounts: \`${await accountsModel.estimatedDocumentCount()}\`
      Total Discord Users: \`${await userModel.estimatedDocumentCount()}\`
      
      ## Bot Information
      Version: \`v${require("../../package.json").version}\`
      Node.js Version: \`${process.version}\`
      `,
      author: {
        name: "PortalPal",
        icon_url: "https://i.ibb.co/RH4VW3H/ezgif-6-e3fb25f475.gif"
      }
    };

    interaction.createFollowup({ embed: embed });
  }
};