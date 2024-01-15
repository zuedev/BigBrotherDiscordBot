import "dotenv/config";
import { Client, GatewayIntentBits, Partials, ActivityType } from "discord.js";
import * as Sentry from "@sentry/node";
import getLogsChannel from "./library/getLogsChannel.js";
import messageGuildOwner from "./library/messageGuildOwner.js";
import { increment } from "./controllers/mongodb.js";

// initialize Sentry if we have a DSN
if (process.env.SENTRY_DSN)
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 1.0,
    environment: process.env.ENVIRONMENT,
  });

const discord = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildEmojisAndStickers,
    GatewayIntentBits.GuildIntegrations,
    GatewayIntentBits.GuildWebhooks,
    GatewayIntentBits.GuildInvites,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildScheduledEvents,
    GatewayIntentBits.AutoModerationConfiguration,
    GatewayIntentBits.AutoModerationExecution,
  ],
  partials: [
    Partials.User,
    Partials.Channel,
    Partials.GuildMember,
    Partials.Message,
    Partials.Reaction,
    Partials.GuildScheduledEvent,
    Partials.ThreadMember,
  ],
});

discord.on("ready", async () => {
  // set bot's status
  discord.user.setActivity("my boot logs...", {
    type: ActivityType.Watching,
  });

  // per-minute interval
  const perMinuteFunction = async () => {
    // update bot's status with amount of guilds it's in
    discord.user.setActivity(`${discord.guilds.cache.size} servers`, {
      type: ActivityType.Watching,
    });
  };
  perMinuteFunction();
  setInterval(perMinuteFunction, 60 * 1000);

  console.log("Discord Logging Bot is ready!");
});

discord.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  let { commandName } = interaction;

  // strip dev prefix if in dev mode
  if (process.env.DISCORD_DEVELOPMENT_GUILD_ID)
    commandName = commandName.replace("dev-", "");

  try {
    const interactionFile = await import(`./interactions/${commandName}.js`);

    await interactionFile.default.execute(interaction);
  } catch (error) {
    console.error(error);

    await interaction.reply({
      content: "There was an error while executing this command!",
      ephemeral: true,
    });
  }
});

// bot has been added to a guild
discord.on("guildCreate", async (guild) => {
  // message guild owner about the setup command
  let setupMessage = "Thank you for adding me to your server!\n\n";
  setupMessage +=
    "To get started, run the `/setup` command in your server.\n\n";
  setupMessage +=
    "If in doubt, you can always run the `/help` command too.\n\n";
  setupMessage +=
    "If you need any help, join our support server: https://discord.gg/UvgJgkREQa";

  await messageGuildOwner(guild, setupMessage);
});

discord.on("error", (error) => {
  console.error(error);
});

// START OF LOGGING STUFF

/*
 * NOTE: You cannot fetch deleted data from the API. For message deletions, `messageDelete` will only emit with the ID, which you cannot use to fetch the complete message containing content, author, or other information, as it is already inaccessible by the time you receive the event.
 */

discord.on(
  "autoModerationActionExecution",
  async (autoModerationActionExecution) => {
    await logJSON(
      autoModerationActionExecution.guild,
      "autoModerationActionExecution",
      {
        autoModerationActionExecution,
      }
    );
  }
);

discord.on("autoModerationRuleCreate", async (autoModerationRule) => {
  await logJSON(autoModerationRule.guild, "autoModerationRuleCreate", {
    autoModerationRule,
  });
});

discord.on("autoModerationRuleDelete", async (autoModerationRule) => {
  await logJSON(autoModerationRule.guild, "autoModerationRuleDelete", {
    autoModerationRule,
  });
});

discord.on(
  "autoModerationRuleUpdate",
  async (oldAutoModerationRule, newAutoModerationRule) => {
    await logJSON(oldAutoModerationRule.guild, "autoModerationRuleUpdate", {
      oldAutoModerationRule,
      newAutoModerationRule,
    });
  }
);

discord.on("channelCreate", async (channel) => {
  // only work in guilds
  if (!channel.guild) return;

  // if the channel is partial, try to fetch it
  if (channel.partial) await channel.fetch();

  await logJSON(channel.guild, "channelCreate", {
    channel,
  });
});

discord.on("channelDelete", async (channel) => {
  // only work in guilds
  if (!channel.guild) return;

  await logJSON(channel.guild, "channelDelete", {
    channel,
  });
});

discord.on("channelUpdate", async (oldChannel, newChannel) => {
  // only work in guilds
  if (!oldChannel.guild) return;

  // fetch the channels if they're partial
  if (oldChannel.partial) await oldChannel.fetch();
  if (newChannel.partial) await newChannel.fetch();

  await logJSON(oldChannel.guild, "channelUpdate", {
    oldChannel,
    newChannel,
  });
});

discord.on("emojiCreate", async (emoji) => {
  // only work in guilds
  if (!emoji.guild) return;

  await logJSON(emoji.guild, "emojiCreate", {
    emoji,
  });
});

discord.on("emojiDelete", async (emoji) => {
  // only work in guilds
  if (!emoji.guild) return;

  await logJSON(emoji.guild, "emojiDelete", {
    emoji,
  });
});

discord.on("emojiUpdate", async (oldEmoji, newEmoji) => {
  // only work in guilds
  if (!oldEmoji.guild) return;

  await logJSON(oldEmoji.guild, "emojiUpdate", {
    oldEmoji,
    newEmoji,
  });
});

discord.on("guildBanAdd", async (ban) => {
  // if the ban is partial, fetch it
  if (ban.partial) await ban.fetch();

  await logJSON(ban.guild, "guildBanAdd", {
    ban,
  });
});

discord.on("guildBanRemove", async (ban) => {
  // if the ban is partial, fetch it
  if (ban.partial) await ban.fetch();

  await logJSON(ban.guild, "guildBanRemove", {
    ban,
  });
});

discord.on("guildDelete", async (guild) => {
  await logJSON(guild, "guildDelete", {
    guild,
  });
});

discord.on("guildIntegrationsUpdate", async (guild) => {
  await logJSON(guild, "guildIntegrationsUpdate", {
    guild,
  });
});

discord.on("guildMemberAdd", async (member) => {
  // if the member is partial, fetch it
  if (member.partial) await member.fetch();

  await logJSON(member.guild, "guildMemberAdd", {
    member,
  });
});

discord.on("guildMemberRemove", async (member) => {
  // if the member is partial, fetch it
  if (member.partial) await member.fetch();

  await logJSON(member.guild, "guildMemberRemove", {
    member,
  });
});

discord.on("guildMemberRemove", async (member) => {
  // if the member is partial, fetch it
  if (member.partial) await member.fetch();

  await logJSON(member.guild, "guildMemberRemove", {
    member,
  });
});

discord.on("guildMemberUpdate", async (oldMember, newMember) => {
  // if the member is partial, fetch it
  if (oldMember.partial) await oldMember.fetch();
  if (newMember.partial) await newMember.fetch();

  await logJSON(oldMember.guild, "guildMemberUpdate", {
    oldMember,
    newMember,
  });
});

discord.on("guildScheduledEventCreate", async (guildScheduledEvent) => {
  await logJSON(guildScheduledEvent.guild, "guildScheduledEventCreate", {
    guildScheduledEvent,
  });
});

discord.on("guildScheduledEventDelete", async (guildScheduledEvent) => {
  await logJSON(guildScheduledEvent.guild, "guildScheduledEventDelete", {
    guildScheduledEvent,
  });
});

discord.on(
  "guildScheduledEventUpdate",
  async (oldGuildScheduledEvent, newGuildScheduledEvent) => {
    await logJSON(oldGuildScheduledEvent.guild, "guildScheduledEventUpdate", {
      oldGuildScheduledEvent,
      newGuildScheduledEvent,
    });
  }
);

discord.on("guildScheduledEventUserAdd", async (guildScheduledEvent, user) => {
  // if the user is partial, fetch it
  if (user.partial) await user.fetch();

  await logJSON(guildScheduledEvent.guild, "guildScheduledEventUserAdd", {
    guildScheduledEvent,
    user,
  });
});

discord.on(
  "guildScheduledEventUserRemove",
  async (guildScheduledEvent, user) => {
    // if the user is partial, fetch it
    if (user.partial) await user.fetch();

    await logJSON(guildScheduledEvent.guild, "guildScheduledEventUserRemove", {
      guildScheduledEvent,
      user,
    });
  }
);

discord.on("guildUnavailable", async (guild) => {
  await logJSON(guild, "guildUnavailable", {
    guild,
  });
});

discord.on("guildUpdate", async (oldGuild, newGuild) => {
  await logJSON(oldGuild, "guildUpdate", {
    oldGuild,
    newGuild,
  });
});

discord.on("inviteCreate", async (invite) => {
  await logJSON(invite.guild, "inviteCreate", {
    invite,
  });
});

discord.on("inviteDelete", async (invite) => {
  await logJSON(invite.guild, "inviteDelete", {
    invite,
  });
});

discord.on("messageDelete", async (message) => {
  // only work in guilds
  if (!message.guild) return;

  await logJSON(message.guild, "messageDelete", {
    message,
  });
});

discord.on("messageDeleteBulk", async (messages, channel) => {
  // only work in guilds
  if (!channel.guild) return;

  await logJSON(channel.guild, "messageDeleteBulk", {
    messages,
    channel,
  });
});

discord.on("messageReactionAdd", async (messageReaction, user) => {
  // only work in guilds
  if (!messageReaction.message.guild) return;

  await logJSON(messageReaction.message.guild, "messageReactionAdd", {
    messageReaction,
    user,
  });
});

discord.on("messageReactionRemove", async (messageReaction, user) => {
  // only work in guilds
  if (!messageReaction.message.guild) return;

  await logJSON(messageReaction.message.guild, "messageReactionRemove", {
    messageReaction,
    user,
  });
});

discord.on("messageReactionRemoveAll", async (message, reactions) => {
  // only work in guilds
  if (!message.guild) return;

  // if the message is partial, fetch it
  if (message.partial) await message.fetch();

  // if any of the reactions are partial, fetch them
  if (reactions.some((reaction) => reaction.partial))
    await Promise.all(reactions.map((reaction) => reaction.fetch()));

  await logJSON(message.guild, "messageReactionRemoveAll", {
    message,
    reactions,
  });
});

discord.on("messageReactionRemoveEmoji", async (reaction) => {
  // only work in guilds
  if (!reaction.message.guild) return;

  // if the message is partial, fetch it
  if (reaction.message.partial) await reaction.message.fetch();

  await logJSON(reaction.message.guild, "messageReactionRemoveEmoji", {
    reaction,
  });
});

discord.on("messageUpdate", async (oldMessage, newMessage) => {
  // only work in guilds
  if (!oldMessage.guild) return;

  // if the message is partial, fetch it
  if (oldMessage.partial) await oldMessage.fetch();
  if (newMessage.partial) await newMessage.fetch();

  await logJSON(oldMessage.guild, "messageUpdate", {
    oldMessage,
    newMessage,
  });
});

discord.on("roleCreate", async (role) => {
  // only work in guilds
  if (!role.guild) return;

  await logJSON(role.guild, "roleCreate", {
    role,
  });
});

discord.on("roleDelete", async (role) => {
  // only work in guilds
  if (!role.guild) return;

  await logJSON(role.guild, "roleDelete", {
    role,
  });
});

discord.on("roleUpdate", async (oldRole, newRole) => {
  // only work in guilds
  if (!oldRole.guild) return;

  await logJSON(oldRole.guild, "roleUpdate", {
    oldRole,
    newRole,
  });
});

discord.on("stageInstanceCreate", async (stageInstance) => {
  // only work in guilds
  if (!stageInstance.guild) return;

  await logJSON(stageInstance.guild, "stageInstanceCreate", {
    stageInstance,
  });
});

discord.on("stageInstanceDelete", async (stageInstance) => {
  // only work in guilds
  if (!stageInstance.guild) return;

  await logJSON(stageInstance.guild, "stageInstanceDelete", {
    stageInstance,
  });
});

discord.on(
  "stageInstanceUpdate",
  async (oldStageInstance, newStageInstance) => {
    // only work in guilds
    if (!oldStageInstance.guild) return;

    await logJSON(oldStageInstance.guild, "stageInstanceUpdate", {
      oldStageInstance,
      newStageInstance,
    });
  }
);

discord.on("stickerCreate", async (sticker) => {
  // only work in guilds
  if (!sticker.guild) return;

  // if the sticker is partial, fetch it
  if (sticker.partial) await sticker.fetch();

  await logJSON(sticker.guild, "stickerCreate", {
    sticker,
  });
});

discord.on("stickerDelete", async (sticker) => {
  // only work in guilds
  if (!sticker.guild) return;

  await logJSON(sticker.guild, "stickerDelete", {
    sticker,
  });
});

discord.on("stickerUpdate", async (oldSticker, newSticker) => {
  // only work in guilds
  if (!oldSticker.guild) return;

  // if the sticker is partial, fetch it
  if (oldSticker.partial) await oldSticker.fetch();
  if (newSticker.partial) await newSticker.fetch();

  await logJSON(oldSticker.guild, "stickerUpdate", {
    oldSticker,
    newSticker,
  });
});

discord.on("threadCreate", async (thread, newlyCreated) => {
  // only work in guilds
  if (!thread.guild) return;

  // if the thread is partial, fetch it
  if (thread.partial) await thread.fetch();

  await logJSON(thread.guild, "threadCreate", {
    thread,
    newlyCreated,
  });
});

discord.on("threadDelete", async (thread) => {
  // only work in guilds
  if (!thread.guild) return;

  await logJSON(thread.guild, "threadDelete", {
    thread,
  });
});

discord.on(
  "threadMembersUpdate",
  async (addedMembers, removedMembers, thread) => {
    // only work in guilds
    if (!thread.guild) return;

    // if the thread is partial, fetch it
    if (thread.partial) await thread.fetch();

    // if any of the added members are partial, fetch them
    if (addedMembers.some((member) => member.partial))
      await Promise.all(addedMembers.map((member) => member.fetch()));

    // if any of the removed members are partial, fetch them
    if (removedMembers.some((member) => member.partial))
      await Promise.all(removedMembers.map((member) => member.fetch()));

    await logJSON(thread.guild, "threadMembersUpdate", {
      addedMembers,
      removedMembers,
      thread,
    });
  }
);

discord.on("threadMemberUpdate", async (oldMember, newMember) => {
  // only work in guilds
  if (!oldMember.guild) return;

  // if the thread is partial, fetch it
  if (oldMember.partial) await oldMember.fetch();
  if (newMember.partial) await newMember.fetch();

  await logJSON(oldMember.guild, "threadMemberUpdate", {
    oldMember,
    newMember,
  });
});

discord.on("threadUpdate", async (oldThread, newThread) => {
  // only work in guilds
  if (!oldThread.guild) return;

  // if the thread is partial, fetch it
  if (oldThread.partial) await oldThread.fetch();
  if (newThread.partial) await newThread.fetch();

  await logJSON(oldThread.guild, "threadUpdate", {
    oldThread,
    newThread,
  });
});

discord.on("userUpdate", async (oldUser, newUser) => {
  // only work in guilds
  if (!oldUser.guild) return;

  // if the user is partial, fetch it
  if (oldUser.partial) await oldUser.fetch();
  if (newUser.partial) await newUser.fetch();

  await logJSON(oldUser.guild, "userUpdate", {
    oldUser,
    newUser,
  });
});

discord.on("voiceStateUpdate", async (oldState, newState) => {
  // only work in guilds
  if (!oldState.guild) return;

  // if the user is partial, fetch it
  if (oldState.member.partial) await oldState.member.fetch();
  if (newState.member.partial) await newState.member.fetch();

  await logJSON(oldState.guild, "voiceStateUpdate", {
    oldState,
    newState,
  });
});

discord.on("webhookUpdate", async (channel) => {
  // only work in guilds
  if (!channel.guild) return;

  // if the channel is partial, fetch it
  if (channel.partial) await channel.fetch();

  await logJSON(channel.guild, "webhookUpdate", {
    channel,
  });
});

// END OF LOGGING STUFF

discord.login(process.env.DISCORD_BOT_TOKEN);

/**
 * Logs a JSON object to the logs channel in a standard format.
 *
 * @param {import("discord.js").Guild} guild
 * @param {string} type
 * @param {object} data
 *
 * @returns {Promise<import("discord.js").Message>}
 */
async function logJSON(guild, type, data) {
  // increment the log count for this guild
  await increment("stats", { key: "logJSON_invocations" }, { value: 1 });

  const logsChannel = await getLogsChannel(guild);

  // if the logs channel doesn't exist, quit
  if (!logsChannel) return;

  // scrape data recursively for secrets
  data = (() => {
    const secrets = [
      process.env.ENVIRONMENT,
      process.env.DISCORD_APPLICATION_ID,
      process.env.DISCORD_BOT_TOKEN,
      process.env.DISCORD_DEVELOPMENT_GUILD_ID,
      process.env.MONGODB_URI,
      process.env.SENTRY_DSN,
    ];

    let clean = data;

    for (const secret of secrets) {
      if (!secret) continue;

      clean = JSON.parse(
        JSON.stringify(clean).replace(new RegExp(secret, "gi"), "[SECRET]")
      );
    }

    return clean;
  })();

  const json = JSON.stringify(data, null, 2);

  // is the data more than 2000 characters?
  if (json.length > 2000) {
    // send a file instead
    const buffer = Buffer.from(json);

    return await logsChannel.send({
      content: `**logJSON/${type}** _(output too long, sent as file)_`,
      files: [
        {
          attachment: buffer,
          name: `${type}.json`,
        },
      ],
    });
  } else {
    // otherwise, send a message
    let message = `**logJSON/${type}**\n`;
    message += "```json\n";
    message += json;
    message += "\n```";

    return await logsChannel.send(message);
  }
}
