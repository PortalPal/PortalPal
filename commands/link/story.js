"use strict";

const {
  getOwnedRealms,
  getPlaytime,
  getStorySettings,
  postStorySettings,
  openRealm,
  closeRealm
} = require("../../src/realm.js");

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

let savedSubCommand;
let savedArgs;
let storyCache = new Map();

module.exports = {
  name: "story",
  description: "Manages the stories feature on a selected realm.",
  cooldown: 15000,
  premiumCooldown: 3000,
  requireLink: true,
  options: [
    {
      type: 1,
      name: "playtime",
      description: "Returns a member's playtime on a selected realm.",
      options: [
        {
          type: 3,
          name: "username",
          description: "The member's username.",
          required: true,
          min_length: 1,
          max_length: 16
        }
      ]
    },
    {
      type: 1,
      name: "settings",
      description: "Manages your story settings on your selected realm.",
      options: [
        {
          type: 5,
          name: "badge-notifications",
          description: "Show badge notifications for unread stories."
        },
        {
          type: 5,
          name: "realm-events",
          description: "Minecraft posts gameplay accomplishments as stories, activating PortalPal to restart the realm."
        },
        {
          type: 5,
          name: "realm-event-coordinates",
          description: `Display coordinates for Realm Events if "Show coordinates" was enabled when events triggered.`
        },
        {
          type: 5,
          name: "timeline",
          description: "Allow everyone to view the Timeline."
        },
        /* {
          type: 5,
          name: "in-game-chat-messages",
          description: "Unused feature yet to come in Realm Stories to enable in game chat messages."
        }, */
        {
          type: 5,
          name: "opt-out",
          description: "Realm owner opting out removes Story Feed, Timeline, and Members tab access for all."
        }
      ]
    },
  ],
  execute: async (interaction, args, dbUser) => {
    const { sub_command } = args;
    savedArgs = args;

    savedSubCommand = sub_command;

    if (sub_command === "settings") {
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

      embed.description = "Choose an realm to apply your realm stories settings with.";

      await msg.edit({
        embed,
        components: [{
          type: 1,
          components: [components]
        }]
      });
    } else if (sub_command === "playtime") {
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

      embed.description = "Choose an realm to view the user's playtime.";

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

  if (savedSubCommand === "playtime") {
    let storiesData = await getStorySettings(interaction.user.id, realmID);

    if (storiesData.playerOptIn === "OPT_OUT" && storiesData.realmOptIn === "OPT_OUT") {
      embed.description = `You do not have permission to view **${savedArgs.username}'s** playtime.\n\nYou do not have Realm Stories enabled.\n\nPlease enable Realm Stories by doing \`/story settings\` and selecting the opt-out option as \`false\`.`;

      interaction.message.edit({ embed, components: [] });

      return;
    }

    let xuid = await gamertagToXuid(interaction.user.id, savedArgs.username);
    let data = await getPlaytime(interaction.user.id, realmID, xuid);

    if (data?.status === 502 || data?.status === 504) {
      embed.description = `Frontend Realms API is down.`;

      interaction.message.edit({ embed, components: [] });

      return;
    }

    if (data.length === 0) {
      embed.description = `No playtime for **${savedArgs.username}** was found.`;

      interaction.message.edit({ embed, components: [] });

      return;
    }

    let dupeCount = {};

    data = data.filter((item, index) => {
      const dupeIndex = data.findIndex(t => t.s === item.s);

      dupeCount[item.s] = 1;

      if (dupeIndex !== index) {
        if (!dupeCount[item.s]) {
          dupeCount[item.s] = 1;
        }

        dupeCount[item.s]++;

        return false;
      }
      return true;
    });

    data.sort((a, b) => b.s - a.s);

    embed.description = `## ${savedArgs.username}'s Playtime\n`;

    for (let i = 0; i < data.length; i++) {
      if (i >= 15) break;

      let date = data[i];

      const currentTimestamp = Math.floor(Date.now() / 1000);
      const secondsDifference = currentTimestamp - date.s;

      let dateFinal;

      if (date.s > currentTimestamp) {
        dateFinal = "right now";
      } else {
        const daysDifference = Math.floor(secondsDifference / (3600 * 24));
        const hoursDifference = Math.floor((secondsDifference % (3600 * 24)) / 3600);
        const minutesDifference = Math.floor((secondsDifference % 3600) / 60);

        if (daysDifference > 0) {
          dateFinal = `${daysDifference} day${daysDifference > 1 ? "s" : ""} ago`;
        } else if (hoursDifference > 0) {
          dateFinal = `${hoursDifference} hour${hoursDifference > 1 ? "s" : ""} ago`;
        } else if (minutesDifference > 0) {
          dateFinal = `${minutesDifference} minute${minutesDifference > 1 ? "s" : ""} ago`;
        } else {
          dateFinal = `${secondsDifference} second${secondsDifference > 1 ? "s" : ""} ago`;
        }
      }

      let count = dupeCount[date.s];

      if (typeof count === "NaN") count = 0;

      embed.description += `- **${i + 1}**. <t:${date.s}:d> - **${dateFinal}** (**x${count}**)\n`
    }
  } else if (savedSubCommand === "settings") {
    let data = await getStorySettings(interaction.user.id, realmID);

    if (typeof savedArgs['badge-notifications'] === "undefined") savedArgs['badge-notifications'] = data.notifications;
    if (typeof savedArgs['realm-events'] === "undefined") savedArgs['realm-events'] = data.autostories;
    if (typeof savedArgs['realm-event-coordinates'] === "undefined") savedArgs['realm-event-coordinates'] = data.coordinates;
    if (typeof savedArgs?.timeline === "undefined") savedArgs.timeline = data.timeline;
    // if (typeof savedArgs['in-game-chat-messages'] === "undefined") savedArgs['in-game-chat-messages'] = data.inGameChatMessages;
    if (typeof savedArgs['opt-out'] === "undefined") {
      savedArgs['opt-out'] = data.playerOptIn;
      savedArgs['opt-out'] = data.realmOptIn;
    }

    const response = await postStorySettings(interaction.user.id, realmID, savedArgs['badge-notifications'], savedArgs['realm-events'], savedArgs['realm-event-coordinates'], savedArgs.timeline, /* savedArgs['in-game-chat-messages'], */ savedArgs['opt-out']);

    if (response === 200 || response === 204) embed.description = `The configured Realm stories settings has been saved.`;
    if (response === 503) embed.description = `The configured Realm stories settings might have been saved.\nDo this command again if this shows as it might have not saved.`;

    if (savedArgs['realm-events'] || !savedArgs['realm-events']) {
      // So we don't have to close their realm if it's already that value.
      if (savedArgs['realm-events'] === data.autostories) return;

      let close = await closeRealm(interaction.user.id, realmID);

      while (close.status === 503) {
        console.log(503, 'close')
        close = await closeRealm(interaction.user.id, realmID);
      }

      let open = await openRealm(interaction.user.id, realmID);

      while (open.status === 503) {
        console.log(503, 'open')
        open = await openRealm(interaction.user.id, realmID);
      }
    }
  }

  interaction.message.edit({ embed, components: [] });
}