import "dotenv/config";
import {
  Client,
  GatewayIntentBits,
  Partials,
  ActivityType,
  PermissionFlagsBits,
  Events,
  ChannelType,
} from "discord.js";
import { execSync } from "child_process";
import messageApplicationOwner from "./library/messageApplicationOwner.js";
import { findOne, updateOne } from "./controllers/mongodb.js";
import express from "express";
import cors from "cors";

const discord = new Client({
  intents: [...Object.values(GatewayIntentBits)],
  partials: [...Object.values(Partials)],
});

discord.on(Events.ClientReady, async () => {
  discord.user.setActivity(`/help`, {
    type: ActivityType.Listening,
  });

  await messageApplicationOwner(discord, {
    content:
      `# Big Brother Bot Ready Event` +
      "\n```json\n" +
      JSON.stringify(
        {
          guilds: discord.guilds.cache.size,
          users: discord.guilds.cache.reduce(
            (accumulator, guild) => accumulator + guild.memberCount,
            0
          ),
        },
        null,
        2
      ) +
      "\n```",
  });

  console.log(`Logged in as ${discord.user.tag}!`);
});

discord.on(Events.InteractionCreate, async (interaction) => {
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

discord.on(Events.Error, (error) => {
  console.error(error);
});

// register event logging for all client events
[
  Events.ApplicationCommandPermissionsUpdate,
  Events.AutoModerationActionExecution,
  Events.AutoModerationRuleCreate,
  Events.AutoModerationRuleDelete,
  Events.AutoModerationRuleUpdate,
  Events.ChannelCreate,
  Events.ChannelDelete,
  Events.ChannelPinsUpdate,
  Events.ChannelUpdate,
  Events.GuildEmojiCreate,
  Events.GuildEmojiDelete,
  Events.GuildEmojiUpdate,
  Events.GuildAuditLogEntryCreate,
  Events.GuildAvailable,
  Events.GuildBanAdd,
  Events.GuildBanRemove,
  Events.GuildCreate,
  Events.GuildDelete,
  Events.GuildIntegrationsUpdate,
  Events.GuildMemberAdd,
  Events.GuildMemberAvailable,
  Events.GuildMemberRemove,
  Events.GuildMembersChunk,
  Events.GuildMemberUpdate,
  Events.GuildScheduledEventCreate,
  Events.GuildScheduledEventDelete,
  Events.GuildScheduledEventUpdate,
  Events.GuildScheduledEventUserAdd,
  Events.GuildScheduledEventUserRemove,
  Events.GuildUnavailable,
  Events.GuildUpdate,
  // Events.InteractionCreate,
  Events.InviteCreate,
  Events.InviteDelete,
  // Events.MessageCreate,
  Events.MessageDelete,
  Events.MessageBulkDelete,
  Events.MessageReactionAdd,
  Events.MessageReactionRemove,
  Events.MessageReactionRemoveAll,
  Events.MessageReactionRemoveEmoji,
  Events.MessageUpdate,
  Events.PresenceUpdate,
  Events.GuildRoleCreate,
  Events.GuildRoleDelete,
  Events.GuildRoleUpdate,
  Events.StageInstanceCreate,
  Events.StageInstanceDelete,
  Events.StageInstanceUpdate,
  Events.GuildStickerCreate,
  Events.GuildStickerDelete,
  Events.GuildStickerUpdate,
  Events.ThreadCreate,
  Events.ThreadDelete,
  Events.ThreadListSync,
  Events.ThreadMembersUpdate,
  Events.ThreadMemberUpdate,
  Events.UserUpdate,
  Events.VoiceStateUpdate,
  Events.WebhooksUpdate,
].forEach((event) => {
  discord.on(event, async (...args) => {
    // TODO: sync to local state then send to db on interval
    // if (process.env.MONGODB_URI)
    //   await updateOne(
    //     "stats",
    //     { key: "GLOBAL" },
    //     { $inc: { eventsLogged: 1 } },
    //     { upsert: true }
    //   );

    // do we have a guild key in the args? Check recursively to support nested args
    let guild = false;

    if (args) {
      for (const arg of args) {
        if (arg.guild) {
          guild = arg.guild;
          break;
        }

        for (const key in arg) {
          if (arg[key] && arg[key].guild) {
            guild = arg[key].guild;
            break;
          }
        }
      }
    }

    if (!guild) return;

    // fetch guild if partial
    if (guild.partial) await guild.fetch();

    if (process.env.MONGODB_URI) {
      // also fetch guild owner
      const guildOwner = await guild.fetchOwner();

      // TODO: sync to local state then send to db on interval
      // await updateOne(
      //   "stats",
      //   { key: `guild_${guild.id}` },
      //   {
      //     $inc: { eventsLogged: 1 },
      //     $set: {
      //       lastKnown: {
      //         guildName: guild.name,
      //         guildMemberCount: guild.memberCount,
      //         guildOwnerId: guildOwner.id,
      //         guildOwnerTag: guildOwner.user.tag,
      //       },
      //     },
      //   },
      //   { upsert: true }
      // );
    }

    for (const arg of args) {
      if (arg.partial) await arg.fetch();
    }

    await logJSON(guild, event, args);
  });
});

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
  // get the logs channel "bb-logs"
  const logsChannel = guild.channels.cache.find(
    (channel) =>
      channel.type === ChannelType.GuildText &&
      (channel.name === "bb-logs" || channel.name === "dlb-logs")
  );

  // if the logs channel doesn't exist, quit
  if (!logsChannel) return;

  // if the logs channel is partial, fetch it
  if (logsChannel.partial) await logsChannel.fetch();

  // do we have the required permissions for the logs channel?
  const requiredLogsChannelPermissions = [
    PermissionFlagsBits.SendMessages,
    PermissionFlagsBits.AttachFiles,
  ];

  const missingPermissions = requiredLogsChannelPermissions.filter(
    (permission) =>
      !logsChannel.permissionsFor(guild.members.me)?.has(permission)
  );

  // if we're missing permissions, quit
  if (missingPermissions.length > 0)
    return console.error(
      `Missing permissions in "${guild.name}" (${
        guild.id
      }): ${missingPermissions
        .map((permission) => `\`${permission}\``)
        .join(", ")}`
    );

  // scrape data recursively for secrets
  data = (() => {
    const secrets = [process.env.ENVIRONMENT, process.env.DISCORD_BOT_TOKEN];

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

  let append = false;

  // if the logs channel is named "dlb-logs", append a message warning about the name change
  if (logsChannel.name === "dlb-logs")
    append =
      "\n:warning: **WARNING:** This channel should be renamed to `bb-logs` instead of `dlb-logs` to avoid issues with the bot in the future.\n";

  // is the data more than 2000 characters?
  if (json.length > 2000) {
    // send a file instead
    const buffer = Buffer.from(json);

    return await logsChannel.send({
      content: `# ${type}\n_(output too long, sent as file)_${
        append ? append : ""
      }`,
      files: [
        {
          attachment: buffer,
          name: `${type}.json`,
        },
      ],
    });
  } else {
    // otherwise, send a message
    let message = `# ${type}\n${append ? append : ""}`;
    message += "```json\n";
    message += json;
    message += "\n```";

    return await logsChannel.send(message);
  }
}

const app = express();

app.use(cors());

app.get("/", async (request, response) => {
  response.send({
    message: "Hello, World!",
  });
});

app.get("/stats", async (request, response) => {
  const statsJson = {
    guilds: discord.guilds.cache.size,
    channels: discord.channels.cache.size,
    users: discord.users.cache.size,
  };

  if (process.env.MONGODB_URI)
    statsJson.globalEventsLogged =
      (await findOne("stats", { key: "GLOBAL" }))?.eventsLogged || 0;

  response.send(statsJson);
});

app.listen(process.env.WEB_API_PORT || 3000, () => {
  console.log(`Listening on port ${process.env.WEB_API_PORT || 3000}!`);
});
