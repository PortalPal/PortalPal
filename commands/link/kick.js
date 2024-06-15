"use strict";

const { getOwnedRealms, inviteUser } = require("../../src/realm.js");
const { generateRandomString } = require("../../src/util.js");
const { gamertagToXuid } = require("../../src/xbl.js");

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

let savedArgs = {};

module.exports = {
  name: "kick",
  description: "Kicks a member from a selected owned realm.",
  cooldown: 5000,
  premiumCooldown: 3000,
  requireLink: true,
  options: [
		{
			type: 3,
			name: "username",
			description: "The member's username.",
			required: true,
			min_length: 1,
			max_length: 16
		}
  ],
  execute: async (interaction, args, dbUser) => {
    savedArgs = args;

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

    embed.description = "Choose an realm to remove the player from.";

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

  const xuid = await gamertagToXuid(interaction.user.id, savedArgs.username)

  const data = await inviteUser(interaction.user.id, realmID, [xuid], "REMOVE");

  if (data === 200) embed.description = `Removed **${savedArgs.username}** from your realm.`;
  if (data != 200) embed.description = `Failed to remove **${savedArgs.username}** from your realm.\n\nPlease try again later.`;
  if (data === 502 || data === 504) embed.description = `Backend Realms API is down.`;

  interaction.message.edit({ embed, components: [] });
}