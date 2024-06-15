"use strict";

require("dotenv").config();

const { Authflow, Titles } = require("prismarine-auth");

const { getCacheFactory } = require("../../src/util.js");
const { getOwnedRealms } = require("../../src/realm.js");
const { getXboxUserData } = require("../../src/xbl.js");

const linkSetup = new Map();

module.exports = {
  name: "link",
  description: "Links an account to you.",
  execute: async (interaction, args, dbUser) => {
    const { user } = interaction;

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

    try {
      if (dbUser.didLink) {
        embed.description = "You have already linked your account.";
        
        return interaction.createFollowup({ embed, flags: 64 });
      }

      if (linkSetup.get(user.id)) {
        embed.description = "You're already linking an account. Check DMs.";
        
      return interaction.createFollowup({ embed, flags: 64 });
      }
      
      linkSetup.set(user.id, 1);

      const userDMs = await user.getDMChannel();

      const flow = new Authflow(undefined, getCacheFactory(dbUser), {
        flow: "sisu",
        authTitle: Titles.MinecraftAndroid,
        deviceType: "Android"
      }, async (code) => {
        if (linkSetup.get(user.id) === 2) {
          try {
            embed.description = "Link expired."
            
            userDMs.createMessage({ embed, flags: 64 });
          } catch {
            linkSetup.delete(user.id);
          }
          
          return linkSetup.delete(user.id);
        }
        
        linkSetup.set(user.id, 2);

        const embed = {
          title: "",
          timestamp: new Date(),
          color: 10181046,
          author: {
            name: "PortalPal",
            icon_url: "https://i.ibb.co/RH4VW3H/ezgif-6-e3fb25f475.gif"
          },
          description: `
          Go **[here](https://microsoft.com/link?otc=${code.user_code})** and link your account.
          `,
        };

        try {
          await userDMs.createMessage({ embed });

          embed.description = "Check Your DMs."
          
          await interaction.createMessage({ embed });
        } catch {
          return linkSetup.delete(user.id);
        }
        
        linkSetup.set(user.id, 2);
      });

      let verifyData;
      
      try {
        verifyData = await flow.getXboxToken();
      } catch (error) {
        dbUser.linkData = {};
        dbUser.save();

        linkSetup.delete(user.id);
        console.log(error)
      }

      const { userXUID: xuid } = verifyData;

      const ownedRealms = await getOwnedRealms(user.id);

      if (typeof ownedRealms === "undefined" || ownedRealms?.length === 0) {
        let noOwnedRealms = {
          title: "",
          timestamp: new Date(),
          color: 10181046,
          author: {
            name: "PortalPal",
            icon_url: "https://i.ibb.co/RH4VW3H/ezgif-6-e3fb25f475.gif"
          },
          description: "You don't own any active realms.\nGet a realm and try relinking again.\n\nMake sure you're linking the right account.",
        };

        dbUser.linkData = {};
        dbUser.didLink = false;
        
        dbUser.save();

        linkSetup.delete(user.id);
        
        return await userDMs.createMessage({ embed: noOwnedRealms });
      }

      embed.description = "Signed in."

      await userDMs.createMessage({ embed });

      linkSetup.delete(user.id);

      dbUser.ownedRealms = ownedRealms;
      dbUser.didLink = true;

      dbUser.save();
    } catch (error) {
      linkSetup.delete(user.id);
      throw error;
    }
  }
};