"use strict";

const { accountsModel } = require("../../src/db.js");
const { getOwnedRealms, inviteUser } = require("../../src/realm.js");
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

let inviteArgs = {};

module.exports = {
  name: "invite",
  description: "Invite users to your selected realm.",
  cooldown: 300000,
  premiumCooldown: 60000,
  requireLink: true,
  options: [
    {
			type: 4,
			name: "amount",
			description: "The amount of requests you want to send. (3 users per request)",
      required: true,
			min_value: 1,
			max_value: 12
		}
  ],
  execute: async (interaction, args, dbUser) => {
    inviteArgs = args;

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

    embed.description = "Choose an realm to invite your members to.";

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

  embed.description = `Loading accounts database...`;

  interaction.message.edit({ embed, components: [] });

  const allAccounts = await accountsModel.find({}, { xuid: 1, hidden: 1 }).lean();

  const realmID = interaction.data.values[0];

  let xuids = [];

  for (let i = 0; i < inviteArgs.amount; i++) {
    while (xuids.length < 3) {
      const randomIndex = Math.floor(Math.random() * allAccounts.length);
      const randomAccount = allAccounts[randomIndex];

      if (!xuids.includes(randomAccount.xuid)) {
        if (!randomAccount.hidden) xuids.push(randomAccount.xuid);
      }
    }

    let totalInvited = i + 1;

    embed.description = `Sending **${totalInvited}**/**${inviteArgs.amount}** requests.\n\nRemember per request sent is **3** users invited.`;

    await interaction.message.edit({ embed, components: [] });

    const response = await inviteUser(interaction.user.id, realmID, xuids, "ADD");

    if (xuids.length === 3) xuids = [];

    if (response === 403 || response === 401) {
      embed.description = `**${totalInvited}** request(s) was sent.\n\nYou're forbidden from using this request.\n\nThis could mean you hit the pending invite limit.`;

      await interaction.message.edit({ embed });

      break;
    } else if (response === 429) {
      embed.description = `**${totalInvited}** request(s) was sent.\n\nWe sent too many requests on our end.\n\nPlease try again later.`;

      await interaction.message.edit({ embed });

      break;
    } else if (response === 502 || response === 504) {
      embed.description = `Backend Realms API is down.`;

      await interaction.message.edit({ embed });

      break;
    }

    if (inviteArgs.amount === totalInvited) {
      embed.description = `Finished sending all **${totalInvited}**/**${inviteArgs.amount}** requests.\n\nRemember per request sent is **3** users invited.`;

      await interaction.message.edit({ embed });

      break;
    }
  }
}