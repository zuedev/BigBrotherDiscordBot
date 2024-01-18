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
      "> I can't find a channel named `bb-logs`. Please create one that I can view, send messages, and attach files in then try again.";
    helpMessage += "\n\n";
  } else {
    // if the logs channel is partial, fetch it
    if (logsChannel.partial) await logsChannel.fetch();

    // do we have the required permissions for the logs channel?
    const requiredLogsChannelPermissions = [
      PermissionFlagsBits.SendMessages,
      PermissionFlagsBits.AttachFiles,
    ];

    const missingRequiredPermissions = requiredLogsChannelPermissions.filter(
      (permission) =>
        !logsChannel
          .permissionsFor(logsChannel.guild.members.me)
          ?.has(permission)
    );

    if (missingRequiredPermissions.length > 0) {
      // convert the missing permissions to a human-readable list
      const missingRequiredPermissionsReadable = missingRequiredPermissions
        .map((permission) => {
          switch (permission) {
            case PermissionFlagsBits.SendMessages:
              return "> - **Send Messages**";
            case PermissionFlagsBits.AttachFiles:
              return "> - **Attach Files**";
            default:
              throw new Error(`Unknown permission: ${permission}`);
          }
        })
        .join("\n");

      helpMessage += "> ### ⚠️ Error: Missing required channel permissions!";
      helpMessage += "\n";
      helpMessage +=
        "> I'm missing some permissions in the `bb-logs` channel. Please give me the following permissions and try again:";
      helpMessage += "\n";
      helpMessage += `${missingRequiredPermissionsReadable}`;
      helpMessage += "\n\n";
    } else {
      // do we have the optional permissions for the server?
      const optionalServerPermissions = [
        PermissionFlagsBits.ManageGuild, // needed by autoModerationAction* events
        PermissionFlagsBits.ManageChannels, // needed by invite* events
      ];

      const missingOptionalPermissions = optionalServerPermissions.filter(
        (permission) =>
          !logsChannel.guild.members.me.permissions?.has(permission)
      );

      if (missingOptionalPermissions.length > 0) {
        // convert the missing permissions to a human-readable list
        const missingOptionalPermissionsReadable = missingOptionalPermissions
          .map((permission) => {
            switch (permission) {
              case PermissionFlagsBits.ManageGuild:
                return "> - **Manage Server:** [Needed by `autoModerationAction*` events](<https://discord.com/developers/docs/topics/gateway-events#auto-moderation-rule-create:~:text=All%20Auto%20Moderation,permission.>)";
              case PermissionFlagsBits.ManageChannels:
                return "> - **Manage Channels:** [Needed by `invite*` events](<https://discord.com/developers/docs/topics/gateway-events#invite-create:~:text=All%20Invite%20related,on%20the%20channel.>)";
              default:
                throw new Error(`Unknown permission: ${permission}`);
            }
          })
          .join("\n");

        helpMessage += "> ### ℹ️ Warning: Missing optional server permissions!";
        helpMessage += "\n";
        helpMessage +=
          "> I'm missing some permissions in this server. These permissions are optional, but I recommend giving them to me so I can do my job better:";
        helpMessage += "\n";
        helpMessage += `${missingOptionalPermissionsReadable}`;
        helpMessage += "\n\n";
      } else {
        helpMessage += "> ### ✅ Success: Troubleshooting complete!";
        helpMessage += "\n";
        helpMessage += "> I wasn't able to find any problems myself. Yay! 🎉";
        helpMessage += "\n\n";
      }
    }
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
