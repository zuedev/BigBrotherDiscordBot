/**
 * Checks if the user is the owner of the application.
 *
 * @param {import("discord.js").Client} client The Discord client.
 * @param {import("discord.js").User} user The user to check.
 *
 * @returns {Promise<boolean>} Whether the user is the owner of the application.
 */
export default async function isApplicationOwner(client, user) {
  const application = await client.application?.fetch();

  if (!application) return false;

  return application.owner?.id === user.id;
}
