"use strict";

const { client } = require("../../index.js");

module.exports = {
  name: "ping",
  description: "Return the bot's current ping.",
  execute: async (interaction, args) => {
    let embed = {
      title: "",
      timestamp: new Date(),
      color: 10181046,
      description: "Getting the current ping...",
      author: {
        name: "PortalPal",
        icon_url: "https://i.ibb.co/RH4VW3H/ezgif-6-e3fb25f475.gif"
      }
    };

    const currentTime = Date.now();

    const msg = await interaction.createFollowup({ embed: embed });

    let message = `**Ping**: \`${Date.now() - currentTime}ms\`\n`;

    for (const i of client.shards) {
      const shard = i[1];

      message += `**Shard ${shard.id + 1}**: \`${shard.lastHeartbeatReceived - shard.lastHeartbeatSent}ms\`\n`;
    }

    embed = {
      title: "",
      timestamp: new Date(),
      color: 10181046,
      description: message,
      author: {
        name: "PortalPal",
        icon_url: "https://i.ibb.co/RH4VW3H/ezgif-6-e3fb25f475.gif"
      }
    };

    await msg.edit({ embed });
  }
};
