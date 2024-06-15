"use strict";

const { getOwnedRealms, getRealmInfo, getRealmIP, getActivePlayers } = require("../../src/realm.js");
const { generateRandomString } = require("../../src/util.js");
const { getClubData, getXboxUserDataBulk } = require("../../src/xbl.js");

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
  name: "bots",
  description: "Returns a list of active possible bots on a selected realm. (Requires PortalPal+)",
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

    embed.description = "Choose an realm to check for bots on.";

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

  let data1 = await getClubData(interaction.user.id, realm.clubId);

  embed.description = `
    ## Bot(s) Active
  `;

  let xuids = []
  let i = 0;
  let isVerifiedBot;

  const clubPresenceMap = new Map(data1.clubPresence.map(user => [user.xuid, user]));

  for (const plr of data.players) {
    const user = clubPresenceMap.get(plr.uuid);

    if (user && user.lastSeenState !== "InGame") {
      xuids.push(plr.uuid);
      i++;
    }
  }

  if (xuids.length === 0) {
    embed.description = `There is no bots on the realm as of right now.\n\nTry again when you think there's bots online.`;

    interaction.message.edit({ embed, components: [] });

    return;
  }

  const profiles = await getXboxUserDataBulk(interaction.user.id, xuids);

  for (const profile of profiles) {
    if (profile.gamertag === "RB Relay" || profile.gamertag === "Un1queShield" || profile.gamertag === "ARASR8261") {
      isVerifiedBot = true;
    } else {
      isVerifiedBot = false;
    }

    embed.description += `- **${profile.gamertag}**\n - Gamerscore: **${profile.gamerScore}**\n - Verified Bot: **${isVerifiedBot}**\n`;
  }

  interaction.message.edit({ embed, components: [] });
}