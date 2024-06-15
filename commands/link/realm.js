"use strict";

const { getOwnedRealms, getRealmInfo } = require("../../src/realm.js");
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
  name: "realm",
  description: "Checks your realm information.",
  cooldown: 15000,
  premiumCooldown: 3000,
  requireLink: true,
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

    embed.description = "Choose an realm to check information on.";

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

  let realm = await getRealmInfo(interaction.user.id, realmID);

  if (realm?.status === 502 || realm?.status === 504) {
    embed.description = `Backend Realms API is down.`;

    interaction.message.edit({ embed, components: [] });

    return;
  }

  if (typeof realm.motd != "string") realm.motd = "N/A";

  if (realm.motd.length === 0) realm.motd = "N/A";
  if (realm.name.length === 0) realm.name = "N/A";

  embed.description = `
    ## Realm Information
    Realm Name: \`${realm.name}\`
    Realm Description: \`${realm.motd}\`
    Realm ID: \`${realm.id}\`
    Pending Member(s): \`${realm.pendingInvites.length}\` 
    Expired: \`${realm.expired}\`
    Max Players: \`${realm.maxPlayers}\`
    Total Member(s): \`${realm.members.length}\`
    Day(s) Left: \`${realm.daysLeft}\`
    Realm State: \`${realm.state}\`
    Default Permission: \`${realm.defaultPermission}\`
  `;

  interaction.message.edit({ embed, components: [] });
}