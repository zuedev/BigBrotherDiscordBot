import {
  Client,
  Events,
  GatewayIntentBits,
  Partials,
  ChannelType,
  PermissionFlagsBits,
} from "npm:discord.js@14.27.0";

const client = new Client({
  intents: Object.values(GatewayIntentBits),
  partials: Object.values(Partials),
});

export function getBotToken(env = Deno.env.toObject()) {
  const { DISCORD_BOT_TOKEN } = env;

  if (!DISCORD_BOT_TOKEN)
    throw new Error(
      "DISCORD_BOT_TOKEN is not set in the environment variables.",
    );

  return DISCORD_BOT_TOKEN;
}

if (import.meta.main) {
  client.login(getBotToken());

  client.on(Events.ClientReady, onClientReady);
  client.on(Events.MessageCreate, onMessageCreate);
  client.on(Events.MessageDelete, onMessageDelete);
  client.on(Events.MessageReactionAdd, onMessageReactionAdd);
  client.on(Events.MessageReactionRemove, onMessageReactionRemove);
  client.on(Events.MessageReactionRemoveAll, onMessageReactionRemoveAll);
}

export function onClientReady(_client) {
  console.log("Events.ClientReady", {
    tag: _client.user.tag,
  });
}

export async function onMessageCreate(message) {
  try {
    if (!message.author.bot) {
      await log(message.guild, {
        content: "Events.MessageCreate",
        files: [
          {
            name: `message.json`,
            attachment: Buffer.from(JSON.stringify(message, null, 2), "utf-8"),
          },
        ],
      });
    }
  } catch (error) {
    console.error(`[ERROR] Events.MessageCreate: ${error.message}`);
  }
}

export async function onMessageDelete(message) {
  try {
    await log(message.guild, {
      content: "Events.MessageDelete",
      files: [
        {
          name: "message.json",
          attachment: Buffer.from(JSON.stringify(message, null, 2), "utf-8"),
        },
      ],
    });
  } catch (error) {
    console.error(`[ERROR] Events.MessageDelete: ${error.message}`);
  }
}

export async function onMessageReactionAdd(messageReaction, user, details) {
  try {
    await log(messageReaction.message.guild, {
      content: "Events.MessageReactionAdd",
      files: [
        {
          name: `messageReaction.json`,
          attachment: Buffer.from(
            JSON.stringify(messageReaction, null, 2),
            "utf-8",
          ),
        },
        {
          name: `user.json`,
          attachment: Buffer.from(JSON.stringify(user, null, 2), "utf-8"),
        },
        {
          name: `details.json`,
          attachment: Buffer.from(JSON.stringify(details, null, 2), "utf-8"),
        },
      ],
    });
  } catch (error) {
    console.error(`[ERROR] Events.MessageReactionAdd: ${error.message}`);
  }
}

export async function onMessageReactionRemove(messageReaction, user, details) {
  try {
    await log(messageReaction.message.guild, {
      content: "Events.MessageReactionRemove",
      files: [
        {
          name: `messageReaction.json`,
          attachment: Buffer.from(
            JSON.stringify(messageReaction, null, 2),
            "utf-8",
          ),
        },
        {
          name: `user.json`,
          attachment: Buffer.from(JSON.stringify(user, null, 2), "utf-8"),
        },
        {
          name: `details.json`,
          attachment: Buffer.from(JSON.stringify(details, null, 2), "utf-8"),
        },
      ],
    });
  } catch (error) {
    console.error(`[ERROR] Events.MessageReactionRemove: ${error.message}`);
  }
}

export async function onMessageReactionRemoveAll(message, reactions) {
  try {
    await log(message.guild, {
      content: "Events.MessageReactionRemoveAll",
      files: [
        {
          name: `message.json`,
          attachment: Buffer.from(JSON.stringify(message, null, 2), "utf-8"),
        },
        {
          name: `reactions.json`,
          attachment: Buffer.from(JSON.stringify(reactions, null, 2), "utf-8"),
        },
      ],
    });
  } catch (error) {
    console.error(`[ERROR] Events.MessageReactionRemoveAll: ${error.message}`);
  }
}

export async function log(guild, message) {
  let logChannel = guild.channels.cache.find(
    (channel) =>
      channel.name === "bigbrother" && channel.type === ChannelType.GuildText,
  );

  if (!logChannel)
    logChannel = await guild.channels.create({
      name: "bigbrother",
      type: ChannelType.GuildText,
      permissionOverwrites: [
        {
          id: guild.roles.everyone,
          deny: [PermissionFlagsBits.ViewChannel],
        },
        {
          id: guild.client.user.id,
          allow: [PermissionFlagsBits.ViewChannel],
        },
      ],
    });

  await logChannel.send(message);
}
