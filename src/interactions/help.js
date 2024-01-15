import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";

import getLogsChannel from "../library/getLogsChannel.js";

const command = new SlashCommandBuilder()
  .setName("help")
  .setDescription("Shows the help menu for this bot.")
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

/**
 * Starts gateway event logging for this server, creating a logs channel if needed.
 *
 * @param {import("discord.js").CommandInteraction} interaction
 *
 * @returns {Promise<import("discord.js").Message>}
 */
const execute = async (interaction) => {
  // double-check that the user is an admin
  if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator))
    return await interaction.reply({
      content: "You must be an administrator to use this command!",
      ephemeral: true,
    });

  // do we have the expected minimum server permissions?
  const expectedPermissionsFlags = [
    PermissionFlagsBits.ViewChannel,
    PermissionFlagsBits.SendMessages,
    PermissionFlagsBits.AttachFiles,
    PermissionFlagsBits.ReadMessageHistory,
    PermissionFlagsBits.ManageGuild, // needed by autoModerationAction* events
    PermissionFlagsBits.ManageChannels, // needed by invite* events
    PermissionFlagsBits.ChangeNickname,
  ];

  let missingPermissions = expectedPermissionsFlags.filter(
    (permission) =>
      !interaction.guild.members.cache
        .get(interaction.client.user.id)
        .permissions.has(permission)
  );

  if (missingPermissions.length > 0) {
    // add the missing permissions descriptions
    missingPermissions = missingPermissions.map((permission) => {
      switch (permission) {
        case PermissionFlagsBits.ViewChannel:
          return "View Channel";
        case PermissionFlagsBits.SendMessages:
          return "Send Messages";
        case PermissionFlagsBits.AttachFiles:
          return "Attach Files";
        case PermissionFlagsBits.ReadMessageHistory:
          return "Read Message History";
        case PermissionFlagsBits.ManageGuild:
          return "Manage Server";
        case PermissionFlagsBits.ManageChannels:
          return "Manage Channels";
        case PermissionFlagsBits.ChangeNickname:
          return "Change Nickname";
        default:
          return "Unknown Permission";
      }
    });

    // create a new link to the bot's invite URL with the required permissions
    const inviteURL = `https://discord.com/oauth2/authorize?client_id=${
      interaction.client.user.id
    }&scope=bot&permissions=${expectedPermissionsFlags.reduce(
      (total, permission) => total + permission,
      BigInt(0)
    )}`;

    let message = `I'm missing the following server permissions:\n- ${missingPermissions.join(
      "\n- "
    )}`;

    message += `\n\nPlease use this link to invite me to your server with the required permissions:\n${inviteURL}`;

    // we're missing some permissions, so let the user know
    return await interaction.reply({
      content: message,
      ephemeral: true,
    });
  }

  // permissions look good, now check if we have a logs channel
  const logsChannel = await getLogsChannel(interaction.guild);

  if (!logsChannel)
    return await interaction.reply({
      content:
        "I couldn't find a logs channel. Please use `/setup` to create one.",
      ephemeral: true,
    });

  // we have a logs channel, so show the help menu
  return await interaction.reply({
    embeds: [
      {
        title: "Help Menu",
        description:
          "This bot is designed to help you keep track of your server's gateway events. To get started, use `/setup` to create a logs channel.",
        fields: [
          {
            name: "Commands",
            value: [
              "`/setup` - Creates a logs channel for this server.",
              "`/help` - Shows this help menu.",
            ].join("\n"),
          },
          {
            name: "Permissions",
            value: [
              "This bot requires the following permissions to work properly:",
              "- View Channel",
              "- Send Messages",
              "- Attach Files",
              "- Read Message History",
            ].join("\n"),
          },
        ],
      },
    ],
    ephemeral: true,
  });
};

export default {
  command,
  execute,
};
