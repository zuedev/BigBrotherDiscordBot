import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import getLogsChannel from "../library/getLogsChannel.js";
import makeLogsChannel from "../library/makeLogsChannel.js";
import { upsert } from "../controllers/mongodb.js";

const command = new SlashCommandBuilder()
  .setName("setup")
  .setDescription("Sets up the bot for this server.")
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addChannelOption((option) =>
    option
      .setName("channel")
      .setDescription(
        "The channel to use for logging. If not provided, one will be created."
      )
      .setRequired(false)
  );

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

  // check if we already have a logs channel
  const existingChannel = await getLogsChannel(interaction.guild);

  // if so, return it
  if (existingChannel)
    return await interaction.reply({
      content: `Gateway event logging is already enabled for this server. The logs channel is <#${existingChannel.id}>.`,
      ephemeral: true,
    });

  // otherwise, see if a channel was provided
  let channel = interaction.options.getChannel("channel");

  // if not, create one if we can
  if (!channel) {
    // otherwise, do we have the permission to create a channel?
    if (
      !interaction.guild.members.cache
        .get(interaction.client.user.id)
        .permissions.has(PermissionFlagsBits.ManageChannels)
    )
      return await interaction.reply({
        content:
          "I don't have permission to create a channel! Please give me the `Manage Channels` permission and try again or provide a channel.",
        ephemeral: true,
      });

    channel = await makeLogsChannel(interaction.guild);
  }

  // save the channel ID to the database
  await upsert(
    "guilds",
    { id: interaction.guild.id },
    { logging_channel_id: channel.id }
  );

  // return a success message
  return await interaction.reply({
    content: `Gateway event logging has been enabled for this server. The logs channel is <#${channel.id}>.`,
    ephemeral: true,
  });
};

export default {
  command,
  execute,
};
