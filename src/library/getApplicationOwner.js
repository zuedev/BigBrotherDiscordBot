/**
 * Gets the owner of the application.
 *
 * @param {import("discord.js").Client} client The Discord client.
 *
 * @returns {Promise<import("discord.js").User>} The owner of the application.
 */
export default async function getApplicationOwner(client) {
  const application = await client.application?.fetch();

  if (!application) return null;

  return application.owner;
}
