"use strict";

const { getOwnedRealms, getActivePlayers } = require("../../src/realm.js");
const { generateRandomString } = require("../../src/util.js");
const { getXboxUserDataBulk } = require("../../src/xbl.js");

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

module.exports = {
  name: "players",
  description: "Get information who is on a selected realm. (Requires PortalPal+)",
  cooldown: 15000,
  premiumCooldown: 3000,
  requireLink: true,
  premiumOnly: true,
  execute: async (interaction, args, dbUser) => {
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

    embed.description = "Choose an realm to check for active members on.";

    await msg.edit({
      embed,
      components: [{
        type: 1,
        components: [components]
      }]
    });
  },
  componentSelectEvent: selected
};

async function selected(interaction) {
  interaction.acknowledge();

  const realmID = interaction.data.values[0];

  let data = await getActivePlayers(interaction.user.id, realmID);

  if (data?.status === 502 || data?.status === 504) {
    embed.description = `Backend Realms API is down.`;

    interaction.message.edit({ embed, components: [] });

    return;
  }

  if (typeof data === "undefined" || data?.players.length === 0) {
    embed.description = `There's no active players on the realm as of right now.`;

    interaction.message.edit({ embed, components: [] });

    return;
  }

  embed.description = `
    ## Player(s) Active
  `;

  let xuids = []
  let i = 0;

  for (const plr of data.players) {
    if (plr.online && plr.uuid) {
      xuids.push(plr.uuid);
      i++;
    }
  }

  if (xuids.length === 0) {
    embed.description = `There is nobody on the realm as of right now.`;

    interaction.message.edit({ embed, components: [] });

    return;
  }

  const profiles = await getXboxUserDataBulk(interaction.user.id, xuids);

  for (const profile of profiles) {
    embed.description += `- **${profile.gamertag}**\n - Gamerscore: **${profile.gamerScore}**\n`;
  }

  interaction.message.edit({ embed, components: [] });
}