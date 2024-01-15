import getGuildOwner from "./getGuildOwner.js";

/**
 * Messages the owner of a guild.
 *
 * @param {import("discord.js").Guild} guild The guild to get the owner of.
 * @param {string} message The message to send to the owner.
 *
 * @returns {Promise<import("discord.js").User>} The owner of the guild.
 */
export default async function messageGuildOwner(guild, message) {
  const owner = await getGuildOwner(guild);

  return await owner.send(message);
}
