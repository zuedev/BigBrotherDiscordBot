/**
 * Gets the owner of the guild.
 *
 * @param {import("discord.js").Guild} guild The guild to get the owner of.
 *
 * @returns {Promise<import("discord.js").User>} The owner of the guild.
 */
export default async function getGuildOwner(guild) {
  return await guild.fetchOwner();
}
