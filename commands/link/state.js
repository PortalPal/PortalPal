"use strict";

const { getOwnedRealms, closeRealm, openRealm } = require("../../src/realm.js");
const { generateRandomString } = require("../../src/util.js");

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

let savedSubCommand;

module.exports = {
  name: "state",
  description: "Manages the state of your selected owned realm.",
  cooldown: 5000,
  premiumCooldown: 3000,
  requireLink: true,
  options: [
    {
      type: 1,
      name: "open",
      description: "Opens your selected owned realm."
    },
    {
      type: 1,
      name: "close",
      description: "Closes your selected owned realm."
    }
  ],
  execute: async (interaction, args, dbUser) => {
    const { sub_command } = args;

    savedSubCommand = sub_command;

    embed.description = "Loading owned realms...";

    const msg = await interaction.createFollowup({ embed });

    const uuid = generateRandomString(8);

    const components = {
      type: 3,
      custom_id: uuid,
      options: [],
      placeholder: "Select a realm"
    };

    const realms = await getOwnedRealms(dbUser.id);

    if (realms?.status === 502 || realms?.status === 504) {
      embed.description = `Backend Realms API is down.`;
  
      interaction.message.edit({ embed, components: [] });
  
      return;
    }

    realms.forEach(realm => {
      components.options.push({
        label: realm.name,
        value: realm.id,
        description: realm.motd
      });
    });

    if (sub_command === "open") {
      embed.description = "Choose an realm to open.";

      await msg.edit({
        embed,
        components: [{
          type: 1,
          components: [components]
        }]
      });
    } else if (sub_command === "close") {
      embed.description = "Choose an realm to close.";

      await msg.edit({
        embed,
        components: [{
          type: 1,
          components: [components]
        }]
      });
    }
  },
  componentSelectEvent: selected
};

async function selected(interaction) {
  interaction.acknowledge();

  const realmID = interaction.data.values[0];

  if (savedSubCommand === "open") {
    const response = await openRealm(interaction.user.id, realmID);

    if (response.status != 200) embed.description = `Failed to open realm.`;
    if (response.status === 502 || response.status === 504) embed.description = `Backend Realms API is down.`;

    if (response) {
      embed.description = `Opened your realm.`;
    } else {
      if (!response) embed.description = `Failed to open realm.`
    }
  } else if (savedSubCommand === "close") {
    const response = await closeRealm(interaction.user.id, realmID);

    if (response.status != 200) embed.description = `Failed to close realm.`;
    if (response.status === 502 || response.status === 504) embed.description = `Backend Realms API is down.`;

    if (response) {
      embed.description = `Closed your realm.`;
    } else {
      if (!response) embed.description = `Failed to close realm.`
    }
  }

  interaction.message.edit({ embed, components: [] });
}