"use strict";

const { getOwnedRealms, resetPendingInvites } = require("../../src/realm.js");
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

module.exports = {
  name: "removeinvites",
  description: "Removes pending invites to your selected realm. (Requires PortalPal+)",
  cooldown: 3600000,
  premiumCooldown: 3600000,
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

    embed.description = "Choose an realm to remove your pending invites from.";

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

  const data = await resetPendingInvites(interaction.user.id, realmID);

  if (data === 200) embed.description = "Removed all pending invites from your realm.";
  if (data != 200) embed.description = "Failed to remove all pending invites from your realm.";
  if (data === 502 || data === 504) embed.description = `Backend Realms API is down.`;

  interaction.message.edit({ embed, components: [] });
}