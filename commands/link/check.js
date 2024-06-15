"use strict";

const { getOwnedRealms, getRealmInfo, getRealmIP, getActivePlayers } = require("../../src/realm.js");
const { generateRandomString } = require("../../src/util.js");
const { getClubData } = require("../../src/xbl.js");

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
  name: "check",
  description: "Checks if your selected realm is online. (Requires PortalPal+)",
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

    embed.description = "Choose an realm to check on.";

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

  let didGetRealmIP;
  let membersOnline;
  let membersOnline2;
  let isOffline;

  const realmID = interaction.data.values[0];

  let realm = await getRealmInfo(interaction.user.id, realmID);

  if (realm?.status === 502 || realm?.status === 504) {
    embed.description = `Backend Realms API is down.`;

    interaction.message.edit({ embed, components: [] });

    return;
  }

  let data = await getRealmIP(interaction.user.id, realmID);

  if (data?.status === 502 || data?.status === 504) {
    embed.description = `Backend Realms API is down.`;

    interaction.message.edit({ embed, components: [] });

    return;
  }

  if (typeof data.address != "string" && data === "offline") didGetRealmIP = false;

  if (typeof data.address === "string" && data != "offline") didGetRealmIP = true;

  let data2 = await getActivePlayers(interaction.user.id, realmID);

  if (data2?.status === 502 || data2?.status === 504) {
    embed.description = `Backend Realms API is down.`;

    interaction.message.edit({ embed, components: [] });

    return;
  }

  if (typeof data2 === undefined || data2?.players.length === 0) membersOnline = false;

  if (typeof data2 === "object" && data2.players.length > 0) membersOnline = true;

  let data3 = await getClubData(interaction.user.id, realm.clubId);

  let i = data3.clubPresence.filter(user => user.lastSeenState.includes("InGame")).length;
  
  if (i > 0) membersOnline2 = true;

  if (i === 0) membersOnline2 = false;

  // Little messy, but gives accurate information if the realm is offline or not.
  // Also if a random issue happens, it just returns ???.
  if (!didGetRealmIP && !membersOnline && !membersOnline2) isOffline = true;

  if (didGetRealmIP && membersOnline && membersOnline2) isOffline = false;

  if (didGetRealmIP && !membersOnline && !membersOnline2) isOffline = false;

  if (didGetRealmIP && membersOnline && !membersOnline2) isOffline = false;

  if (didGetRealmIP && !membersOnline && membersOnline2) isOffline = "???";

  if (!didGetRealmIP && membersOnline && membersOnline2) isOffline = "???";

  if (!didGetRealmIP && !membersOnline && membersOnline2) isOffline = "???";

  if (!didGetRealmIP && membersOnline && !membersOnline2) isOffline = "???";

  embed.description = `
    ## Realm Check
    Realm IP Available: \`${didGetRealmIP}\`
    Members Online: \`${membersOnline}\`
    Members Online 2: \`${membersOnline2}\`

    Is Offline: \`${isOffline}\`
  `;

  interaction.message.edit({ embed, components: [] });
}