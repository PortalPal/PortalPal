"use strict";

const { getOwnedRealms, getRealmInfo, setRealmInfo } = require("../../src/realm.js");
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
  name: "motd",
  description: "Changes how you describe your selected owned realm.",
  cooldown: 15000,
  premiumCooldown: 3000,
  requireLink: true,
  options: [
		{
			type: 3,
			name: "motd",
			description: "The realm's description.",
			required: true,
			min_length: 1,
			max_length: 64
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

    embed.description = "Choose an realm to redescribe.";

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

  const data = await setRealmInfo(interaction.user.id, realmID, realm.name, savedArgs.motd)

  if (data === 204) embed.description = `Changed the realm description to "${savedArgs.motd}".`
  if (data === 503) embed.description = `Try changing your realm description again later.\n\nYour realm description "${savedArgs.motd}" might have been applied though.`
  if (data != 503 || data != 204) embed.description = `Failed to change your realm description. Try again later.`
  if (data === 502 || data === 504) embed.description = `Backend Realms API is down.`;

  interaction.message.edit({ embed, components: [] });
}