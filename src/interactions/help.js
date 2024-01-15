import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";

const command = new SlashCommandBuilder()
  .setName("help")
  .setDescription("Tries to help you with the bot")
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

/**
 * Starts gateway event logging for this server, creating a logs channel if needed.
 *
 * @param {import("discord.js").CommandInteraction} interaction
 *
 * @returns {Promise<import("discord.js").Message>}
 */
const execute = async (interaction) => {
  // defer the reply to let the user know we're working on it
  await interaction.deferReply();

  // start of help message
  let helpMessage = "# Big Brother Bot Help";
  helpMessage += "\n\n";

  // attempt some troubleshooting
  helpMessage += "## Automated Troubleshooting";
  helpMessage += "\n\n";
  helpMessage +=
    "I'm going to try to help you troubleshoot your problem automatically.";
  helpMessage += "\n\n";

  // is there a bb-logs channel?
  const logsChannel = interaction.guild.channels.cache.find(
    (channel) => channel.name === "bb-logs"
  );

  if (!logsChannel) {
    helpMessage += "> ### ⚠️ Error: Missing channel!";
    helpMessage += "\n";
    helpMessage +=
      "> I can't find a channel named `bb-logs`. Please create one that I can view and send messages in and try again.";
    helpMessage += "\n\n";
  } else {
    helpMessage += "> ### ✅ Success: Troubleshooting complete!";
    helpMessage += "\n";
    helpMessage += "> I wasn't able to find any problems myself. Yay! 🎉";
    helpMessage += "\n\n";
  }

  // always place generic support message at the end of the help message
  helpMessage += "## Further Support";
  helpMessage += `\n\n`;
  helpMessage +=
    "If you need more help, please join the [Discord server](<https://zue.dev/discord>) and ask in the `#support` channel.";

  // send the help message
  await interaction.editReply(helpMessage);
};

export default {
  command,
  execute,
};
