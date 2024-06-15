"use strict";

const { getOwnedRealms, getRealmCode, resetRealmCode } = require("../../src/realm.js");
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
  name: "code",
  description: "Manages a realm code on a selected owned realm.",
  cooldown: 15000,
  premiumCooldown: 3000,
  requireLink: true,
  options: [
    {
      type: 1,
      name: "get",
      description: "Grabs the realm code on a selected owned realm."
    },
    {
      type: 1,
      name: "reset",
      description: "Resets the realm code on a selected owned realm"
    },
  ],
  execute: async (interaction, args, dbUser) => {
    const { sub_command } = args;

    savedSubCommand = sub_command;

    if (sub_command === "get") {
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

      realms.forEach(realm => {
        components.options.push({
          label: realm.name,
          value: realm.id,
          description: realm.motd
        });
      });

      embed.description = "Choose an realm to grab the realm code on.";

      await msg.edit({
        embed,
        components: [{
          type: 1,
          components: [components]
        }]
      });
    } else if (sub_command === "reset") {
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

      embed.description = "Choose an realm to reset the realm code on.";

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

  if (savedSubCommand === "get") {
    let data = await getRealmCode(interaction.user.id, realmID);

    if (data?.status === 502 || data?.status === 504) {
      embed.description = `Backend Realms API is down.`;
  
      interaction.message.edit({ embed, components: [] });
  
      return;
    }

    embed.description = `
    ## Realm Code Information
    Realm Code: \`${data.linkId}\`
    Realm URL: [Click here](${data.url})
    `;
  } else if (savedSubCommand === "reset") {
    let data = await resetRealmCode(interaction.user.id, realmID);

    if (data?.status === 502 || data?.status === 504) {
      embed.description = `Backend Realms API is down.`;
  
      interaction.message.edit({ embed, components: [] });
  
      return;
    }

    embed.description = `
    ## Realm Code Information
    Realm Code: \`${data.linkId}\`
    Realm URL: [Click here](${data.url})
    `;
  }

  interaction.message.edit({ embed, components: [] });
}