"use strict";

module.exports = {
  name: "unlink",
  description: "Unlinks your account.",
  requireLink: true,
  execute: async (interaction, args, dbUser) => {
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
    
    if (dbUser.linkData.length != 0 || dbUser.didLink === true) {
      dbUser.didLink = false;
      dbUser.linkData = {};
      dbUser.save();

      embed.description = "Your account has been unlinked.";

      interaction.createFollowup({ embed, flags: 64 });
    } else {
      embed.description = "You never linked an account.";
      interaction.createFollowup({ embed, flags: 64 });
    }
  }
};