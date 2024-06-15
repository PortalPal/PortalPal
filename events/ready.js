"use strict";

const { client } = require("../index.js");

client.once("ready", async () => {
  console.log(`Logged in as ${client.user.username}#${client.user.discriminator} (${client.user.id})`);

  const commands = [];

  client.commands.forEach((cmd) => {
    if (!cmd.name) throw TypeError(`${cmd.name} is missing the "name" value.`);
    
    if (cmd.description?.length > 100) throw SyntaxError(`${cmd.name}'s description is over 100 characters long.`);

    if (cmd.description.length > 100) console.log(cmd.name);

    commands.push({
      name: cmd.name,
      description: cmd.description ?? "No description available.",
      options: cmd.options,
      dm_permission: cmd.dm_permission,
      nsfw: cmd.nsfw
    });

    cmd.options = undefined;
  });

  client.bulkEditCommands(commands);

  client.editStatus("dnd", {
    name: "/w realms",
    type: 0
  });
});