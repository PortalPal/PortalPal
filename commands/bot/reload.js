"use strict";

const { client } = require("../../index.js");

module.exports = {
  name: "reload",
  description: "Reloads an command. (Requires Staff)",
  staffOnly: true,
  options: [
    {
      type: 3,
      name: "command",
      description: "The name of the command to reload",
      required: true,
      min_length: 2,
      max_length: 25
    },
  ],
  execute: async (interaction, args) => {
    const { command } = args;

    let embed = {
      title: "",
      timestamp: new Date(),
      color: 10181046,
      author: {
        name: "PortalPal",
        icon_url: "https://i.ibb.co/RH4VW3H/ezgif-6-e3fb25f475.gif"
      },
      description: "",
    };
    
    const commandData = client.commands.get(command);

    if (!commandData) {
      embed.description = `\`${command}\` is not a valid command name.`;
      return await interaction.createFollowup({ embed });
    }

    const commandPath = `../${commandData.category}/${commandData.name}.js`;

    delete require.cache[require.resolve(commandPath)];

    client.commands.delete(commandData.name);

    const newCommand = require(commandPath);

    newCommand.category = commandData.category;

    client.commands.set(commandData.name, newCommand);

    embed.description = `Successfully reloaded the command \`${command}\`.`

    await interaction.createFollowup({ embed });
  }
};