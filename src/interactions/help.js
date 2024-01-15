import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";

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
  // check if we have a bb-logs channel
  const logsChannel = interaction.guild.channels.cache.find(
    (channel) => channel.name === "bb-logs"
  );

  // if we don't have a bb-logs channel, tell the user to create one in the reply
  if (!logsChannel) {
    return interaction.reply({
      content:
        "Please create a channel named `bb-logs` and try this command again.",
      ephemeral: true,
    });
  }

  // minimum permissions for the logs channel
  const requiredLogsChannelPermissions = [
    PermissionFlagsBits.SendMessages,
    PermissionFlagsBits.AttachFiles,
  ];

  // optional permissions for the server (needed for some events)
  const optionalServerPermissions = [
    PermissionFlagsBits.ManageGuild, // needed by autoModerationAction* events
    PermissionFlagsBits.ManageChannels, // needed by invite* events
  ];

  const missingPermissions = requiredLogsChannelPermissions.filter(
    (permission) =>
      !logsChannel.permissionsFor(interaction.guild.me).has(permission)
  );

  // if we're missing permissions, tell the user to fix it
  if (missingPermissions.length > 0) {
    return interaction.reply({
      content: `Please give me the following permissions in the \`bb-logs\` channel: ${missingPermissions
        .map((permission) => `\`${permission}\``)
        .join(", ")}`,
      ephemeral: true,
    });
  }

  // do we have the optional permissions for the logs channel?
  const optionalMissingPermissions = optionalServerPermissions.filter(
    (permission) => !interaction.guild.me.permissions.has(permission)
  );

  // if we're missing permissions, tell the user that some features won't work
  if (optionalMissingPermissions.length > 0) {
    await interaction.reply({
      content: `I'm missing the following permissions in this server: ${optionalMissingPermissions
        .map((permission) => `\`${permission}\``)
        .join(", ")}. Some features may not work.`,
      ephemeral: true,
    });
  }
};

export default {
  command,
  execute,
};
