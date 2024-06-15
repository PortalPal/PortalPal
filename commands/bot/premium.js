"use strict";

module.exports = {
  name: "premium",
  description: "Returns premium information.",
  execute: async (interaction, args) => {
    let embed = {
      title: "",
      timestamp: new Date(),
      color: 10181046,
      description: `## PortalPal+
      **PortalPal+** is a simple subscription that you can pay by boosting our discord.
      
      **PortalPal+** offers the following benefits below for you to get more members:
      - Access to a command that resets your pending invites.
      - Reduced cooldown for the \`/invite\` command.
      
      After boosting, message the owner to get your **PortalPal+** subscription today!
      
      Your **PortalPal+** subscription ends as soon as your discord boost ends.`,
      author: {
        name: "PortalPal",
        icon_url: "https://i.ibb.co/RH4VW3H/ezgif-6-e3fb25f475.gif"
      }
    };
  
    interaction.createFollowup({ embed: embed });
  }
};