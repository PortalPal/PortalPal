"use strict";

const { getOwnedRealms, setRealmInfo, getRealmInfo } = require("../../src/realm.js");
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

let savedArgs;

module.exports = {
  name: "name",
  description: "Names your selected owned realm.",
  cooldown: 15000,
  premiumCooldown: 3000,
  requireLink: true,
  options: [
		{
			type: 3,
			name: "name",
			description: "The realm's name.",
			required: true,
			min_length: 1,
			max_length: 32
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

    embed.description = "Choose an realm to rename.";

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

  const realm = await getRealmInfo(interaction.user.id, realmID);

  if (realm?.status === 502 || realm?.status === 504) {
    embed.description = `Backend Realms API is down.`;

    interaction.message.edit({ embed, components: [] });

    return;
  }

  const data = await setRealmInfo(interaction.user.id, realmID, savedArgs.name, realm.motd)

  if (data === 204) embed.description = `Changed the realm name to "${savedArgs.name}".`
  if (data === 503) embed.description = `Try changing your realm name again later.\n\nYour realm name "${savedArgs.name}" might have been applied though.`
  if (data != 503 || data != 204) embed.description = `Failed to change your realm name. Try again later.`
  if (data === 502 || data === 504) embed.description = `Backend Realms API is down.`;

  interaction.message.edit({ embed, components: [] });
}