import { find, upsert } from "../controllers/mongodb.js";

/**
 * Gets the logs channel for the guild if it exists and returns it.
 *
 * @param {import("discord.js").Guild} guild
 *
 * @returns {Promise<import("discord.js").TextChannel>}
 */
export default async function getLogsChannel(guild) {
  let data = await find("guilds", { id: guild.id });

  if (!data.length) return null;

  data = data[0];

  if (!data.logging_channel_id) return null;

  // try to get the channel object
  const channel = guild.channels.cache.get(data.logging_channel_id);

  // if we can't, delete the channel ID from the database, and return null
  if (!channel) {
    await upsert("guilds", { id: guild.id }, { logging_channel_id: null });
    return null;
  }

  // otherwise, return the channel
  return channel;
}
