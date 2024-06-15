"use strict";

require("dotenv").config();

const Eris = require("eris");
const fs = require("node:fs");

const { getProtocolVersion, getGameVersion, getHash } = require("./src/util.js");

const verData = require("./ext/data.json");

(async() => {
  verData.protocol = String(await getProtocolVersion());
  verData.version = String(await getGameVersion());
  verData.hash = String(await getHash());

  fs.writeFileSync(`./ext/data.json`, JSON.stringify(verData, null, 2));
})();

const client = new Eris(process.env.DEV_TOKEN, {
  options: {
    intents: [
      "all"
    ],
    disable_events: [
      "CHANNEL_CREATE",
      "CHANNEL_DELETE",
      "CHANNEL_UPDATE",
      "GUILD_BAN_ADD",
      "GUILD_BAN_REMOVE",
      "GUILD_DELETE",
      "GUILD_MEMBER_ADD",
      "GUILD_MEMBER_REMOVE",
      "GUILD_MEMBER_UPDATE",
      "GUILD_ROLE_CREATE",
      "GUILD_ROLE_DELETE",
      "GUILD_ROLE_UPDATE",
      "GUILD_UPDATE",
      "MESSAGE_CREATE",
      "MESSAGE_DELETE",
      "MESSAGE_DELETE_BULK",
      "MESSAGE_UPDATE",
      "PRESENCE_UPDATE",
      "TYPING_START",
      "USER_UPDATE",
      "VOICE_STATE_UPDATE"
    ],
    maxShards: "auto"
  }
});

module.exports = {
  client: client
};

const eventFiles = fs
  .readdirSync("./events/")
  .filter(file => file.endsWith(".js"));

for (const event of eventFiles) {
  try {
    require(`./events/${event}`);
  } catch (error) {
    console.error(`Unable to load event: ${event}.\n\nStack: ${error.stack}`);
  }
}

client.commands = new Map();
const commandFolders = fs.readdirSync("./commands");

for (const folder of commandFolders) {
  if (folder === "unused") continue;

  const commandFiles = fs
    .readdirSync(`./commands/${folder}`)
    .filter(file => file.endsWith(".js"));

  for (const file of commandFiles) {
    let command;

    try {
      command = require(`./commands/${folder}/${file}`);
    } catch (error) {
      console.error(`Unable to load command: ${file}.\n\nStack: ${error.stack}`);

      process.exit(1);
    }

    if (command.disabled) {
      command.execute = undefined;
      command.componentPressEvent = undefined;
      command.componentSelectEvent = undefined;
    }

    command.category = folder;

    client.commands.set(command.name, command);
  }
}

client.on("error", (error) => {
  if (error.code === 1006) return;
  console.error(error);
});

client.connect();

process.on("warning", (warning) => {
  console.warn(warning);
});

process.on("unhandledRejection", (error) => {
  if ([10062, 50001, 10003].includes(error.code) || error.stack.includes("Authentication failed, timed out")) return;

  console.error(error);
});

process.on("uncaughtException", (error) => {
  console.error(error);

  process.exit(0);
});