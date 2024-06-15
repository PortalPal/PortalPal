"use strict";

const Eris = require("eris");
const ms = require("ms");

const { userModel, createUserDefaults } = require("../src/db.js");
const { client } = require("../index.js");

const cooldowns = new Map();

client.on("interactionCreate", (interaction) => {
  if (interaction instanceof Eris.CommandInteraction)
    CommandInteraction(interaction);
  else if (interaction instanceof Eris.ComponentInteraction)
    ComponentInteraction(interaction);
  else if (interaction instanceof Eris.AutocompleteInteraction)
    AutocompleteInteraction(interaction);
});

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

async function CommandInteraction(interaction) {
  try {
    await interaction.acknowledge();
  } catch {
    return;
  }

  try {
    const args = {};

    interaction.data.options?.forEach((arg) => {
      if (arg.type === 1) {
        args.sub_command = arg.name;
        for (const option of arg.options) {
          args[option.name] = option.value;
        }
      } else args[arg.name] = arg.value;
    });

    if (!interaction.user) interaction.user = interaction.member.user;

    const member = interaction.user;
    const guild = interaction.channel.guild;

    const command = client.commands.get(interaction.data.name);

    const user =
      (await userModel.findOne({ id: member.id })) ??
      createUserDefaults({ id: member.id });

    if (user.blacklisted) {
      embed.description = "You're blacklisted from using PortalPal.";

      return interaction.createFollowup({
        embed,
        flags: 64,
      });
    }

    if (command.staffOnly && !user.staff) {
      embed.description = "You do not have permission to use this command.";

      return interaction.createFollowup({
        embed,
        flags: 64
      });
    }

    if (command.requireLink && !user.didLink) {
      embed.description = "This command requires an linked account."

      return interaction.createFollowup({
        embed,
        flags: 64
      });
    }

    if (command.premiumOnly && !user.premium) {
      embed.description = "This command requires a **PortalPal+** subscription."

      return interaction.createFollowup({
        embed,
        flags: 64
      });
    }

    if (command.disabled) {
      embed.description = "This command is disabled.";

      return interaction.createFollowup({
        embed,
        flags: 64
      });
    }

    if (command.dmsOnly && guild) {
      embed.description = "This command is only available in DMs.";

      return interaction.createFollowup({
        embed,
        flags: 64
      });
    }

    if (guild) {
      // handle cooldowns
      if (command.cooldown) {
        const cooldown = cooldowns.get(member.id) ?? {};
        const msData = { long: true };

        if (cooldown[command.name] > Date.now()) {
          const rateLimitEnd = ms(cooldown[command.name] - Date.now(), msData);

          if (true) {
            embed.description = `You're on cooldown for ${rateLimitEnd}.`;

            interaction.createFollowup({
              embed,
              flags: 64
            });
          }
          return;
        }

        cooldown[command.name] = Date.now() + (user.premium ? command.premiumCooldown : command.cooldown);
        cooldowns.set(member.id, cooldown);
      }
    }

    await command.execute(interaction, args, user);
  } catch (error) {
    console.error(error);

    embed.description = "An error occurred.";

    interaction.createFollowup({ embed, flags: 64 });
  }
}

async function ComponentInteraction(interaction) {
  let cmdName;

  try {
    if (!interaction.user) interaction.user = interaction.member.user;

    const command = interaction.message.interaction;

    const commandName = command.name.split(" ")[0];

    cmdName = commandName;

    const { componentPressEvent, componentSelectEvent } =
      client.commands.get(commandName);

    const { custom_id } = interaction.data;

    if (
      commandName !== "msg" &&
      interaction.message.interaction.user.id !==
      (interaction.member?.id ?? interaction.user.id)
    ) {
      embed.description = "This is not for you.";

      return interaction.createMessage({
        embed,
        flags: 64,
      });
    }

    if (interaction.data.component_type === 2)
      await componentPressEvent(interaction, custom_id);
    else if (interaction.data.component_type === 3)
      await componentSelectEvent(interaction, custom_id);
  } catch (error) {
    console.error(error);
  }
}

async function AutocompleteInteraction(interaction) {
  try {
    const { name, options } = interaction.data;

    const argument = options.find((args) => args.focused);

    const { autocompleteEvent } = client.commands.get(name.split(" ")[0]);

    await autocompleteEvent(interaction, argument);
  } catch (error) {
    console.error(error);
  }
}
