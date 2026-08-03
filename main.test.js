import { expect } from "jsr:@std/expect";
import { ChannelType, PermissionFlagsBits } from "npm:discord.js@14.27.0";
import {
  getBotToken,
  log,
  onClientReady,
  onMessageCreate,
  onMessageDelete,
  onMessageReactionAdd,
  onMessageReactionRemove,
  onMessageReactionRemoveAll,
} from "./main.js";

function createFakeChannel({
  name = "bigbrother",
  type = ChannelType.GuildText,
} = {}) {
  const sent = [];
  return {
    name,
    type,
    send(message) {
      sent.push(message);
      return Promise.resolve(message);
    },
    sent,
  };
}

// Mimics the slice of the discord.js Guild API that log() relies on.
function createFakeGuild({ existingChannel = null, botId = "bot-id" } = {}) {
  const cache = existingChannel ? [existingChannel] : [];
  const createCalls = [];
  return {
    client: { user: { id: botId } },
    roles: { everyone: "everyone-role-id" },
    channels: {
      cache: {
        find: (predicate) => cache.find(predicate),
      },
      create(options) {
        const channel = createFakeChannel(options);
        cache.push(channel);
        createCalls.push(options);
        return Promise.resolve(channel);
      },
      createCalls,
    },
  };
}

function decodeAttachment(attachment) {
  return JSON.parse(new TextDecoder().decode(attachment));
}

function findFile(message, name) {
  return message.files.find((file) => file.name === name);
}

function withStub(object, key, stub, fn) {
  const original = object[key];
  object[key] = stub;
  return Promise.resolve(fn()).finally(() => {
    object[key] = original;
  });
}

Deno.test("getBotToken() throws when DISCORD_BOT_TOKEN is missing", () => {
  expect(() => getBotToken({})).toThrow(Error);
});

Deno.test("getBotToken() returns the token when present", () => {
  expect(getBotToken({ DISCORD_BOT_TOKEN: "abc123" })).toBe("abc123");
});

Deno.test("onClientReady() logs the bot's tag", async () => {
  const logs = [];
  await withStub(
    console,
    "log",
    (...args) => logs.push(args),
    () => {
      onClientReady({ user: { tag: "Bot#0001" } });
    },
  );

  expect(logs).toEqual([["Events.ClientReady", { tag: "Bot#0001" }]]);
});

Deno.test(
  "log() sends to an existing bigbrother channel without creating one",
  async () => {
    const channel = createFakeChannel();
    const guild = createFakeGuild({ existingChannel: channel });

    await log(guild, { content: "hello" });

    expect(guild.channels.createCalls.length).toBe(0);
    expect(channel.sent).toEqual([{ content: "hello" }]);
  },
);

Deno.test(
  "log() creates a bigbrother channel with correct permissions when none exists",
  async () => {
    const guild = createFakeGuild({ botId: "bot-42" });

    await log(guild, { content: "hello" });

    expect(guild.channels.createCalls).toEqual([
      {
        name: "bigbrother",
        type: ChannelType.GuildText,
        permissionOverwrites: [
          { id: guild.roles.everyone, deny: [PermissionFlagsBits.ViewChannel] },
          { id: "bot-42", allow: [PermissionFlagsBits.ViewChannel] },
        ],
      },
    ]);
  },
);

Deno.test("onMessageCreate() ignores messages authored by bots", async () => {
  const channel = createFakeChannel();
  const guild = createFakeGuild({ existingChannel: channel });
  const message = { author: { bot: true }, content: "hi", guild };

  await onMessageCreate(message);

  expect(channel.sent.length).toBe(0);
});

Deno.test(
  "onMessageCreate() logs non-bot messages with a message.json attachment",
  async () => {
    const channel = createFakeChannel();
    const guild = createFakeGuild({ existingChannel: channel });
    const message = { author: { bot: false }, content: "hi", guild };

    await onMessageCreate(message);

    expect(channel.sent.length).toBe(1);
    const sentMessage = channel.sent[0];
    expect(sentMessage.content).toBe("Events.MessageCreate");
    const decoded = decodeAttachment(
      findFile(sentMessage, "message.json").attachment,
    );
    expect(decoded.content).toBe("hi");
    expect(decoded.author).toEqual({ bot: false });
  },
);

Deno.test(
  "onMessageCreate() swallows serialization errors instead of throwing",
  async () => {
    const channel = createFakeChannel();
    const guild = createFakeGuild({ existingChannel: channel });
    const message = { author: { bot: false }, guild };
    message.circular = message; // JSON.stringify cannot handle cycles

    const errors = [];
    await withStub(
      console,
      "error",
      (...args) => errors.push(args),
      () => onMessageCreate(message),
    );

    expect(channel.sent.length).toBe(0);
    expect(errors.length).toBe(1);
    expect(errors[0][0]).toContain("Events.MessageCreate");
  },
);

Deno.test(
  "onMessageDelete() logs the deleted message as message.json",
  async () => {
    const channel = createFakeChannel();
    const guild = createFakeGuild({ existingChannel: channel });
    const message = { id: "msg-2", guild };

    await onMessageDelete(message);

    const sentMessage = channel.sent[0];
    expect(sentMessage.content).toBe("Events.MessageDelete");
    const decoded = decodeAttachment(
      findFile(sentMessage, "message.json").attachment,
    );
    expect(decoded.id).toBe("msg-2");
  },
);

Deno.test(
  "onMessageReactionAdd() logs reaction, user, and details as separate attachments",
  async () => {
    const channel = createFakeChannel();
    const guild = createFakeGuild({ existingChannel: channel });
    const messageReaction = { emoji: { name: "👍" }, message: { guild } };
    const user = { id: "user-1", username: "tester" };
    const details = { type: 1 };

    await onMessageReactionAdd(messageReaction, user, details);

    const sentMessage = channel.sent[0];
    expect(sentMessage.content).toBe("Events.MessageReactionAdd");
    expect(
      decodeAttachment(findFile(sentMessage, "messageReaction.json").attachment)
        .emoji,
    ).toEqual({ name: "👍" });
    expect(
      decodeAttachment(findFile(sentMessage, "user.json").attachment),
    ).toEqual(user);
    expect(
      decodeAttachment(findFile(sentMessage, "details.json").attachment),
    ).toEqual(details);
  },
);

Deno.test(
  "onMessageReactionRemove() logs reaction, user, and details as separate attachments",
  async () => {
    const channel = createFakeChannel();
    const guild = createFakeGuild({ existingChannel: channel });
    const messageReaction = { emoji: { name: "🎉" }, message: { guild } };
    const user = { id: "user-2", username: "tester2" };
    const details = { type: 0 };

    await onMessageReactionRemove(messageReaction, user, details);

    const sentMessage = channel.sent[0];
    expect(sentMessage.content).toBe("Events.MessageReactionRemove");
    expect(
      decodeAttachment(findFile(sentMessage, "messageReaction.json").attachment)
        .emoji,
    ).toEqual({ name: "🎉" });
    expect(
      decodeAttachment(findFile(sentMessage, "user.json").attachment),
    ).toEqual(user);
    expect(
      decodeAttachment(findFile(sentMessage, "details.json").attachment),
    ).toEqual(details);
  },
);

Deno.test(
  "onMessageReactionRemoveAll() logs message.json and reactions.json",
  async () => {
    const channel = createFakeChannel();
    const guild = createFakeGuild({ existingChannel: channel });
    const message = { id: "msg-3", guild };
    const reactions = [{ emoji: { name: "👍" } }, { emoji: { name: "🎉" } }];

    await onMessageReactionRemoveAll(message, reactions);

    const sentMessage = channel.sent[0];
    expect(sentMessage.content).toBe("Events.MessageReactionRemoveAll");
    expect(
      decodeAttachment(findFile(sentMessage, "message.json").attachment).id,
    ).toBe("msg-3");
    expect(
      decodeAttachment(findFile(sentMessage, "reactions.json").attachment),
    ).toEqual(reactions);
  },
);
