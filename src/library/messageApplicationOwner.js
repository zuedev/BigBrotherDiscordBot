import getApplicationOwner from "./getApplicationOwner.js";

/**
 * Sends a message to the application owner.
 *
 * @param {import("discord.js").Client} client The Discord client.
 * @param {Promise<import("discord.js").MessageCreateOptions>} messageCreateOptions The message to send.
 *
 * @returns {Promise<import("discord.js").Message>} The message that was sent.
 */
export default async function messageApplicationOwner(
  client,
  messageCreateOptions
) {
  const applicationOwner = await getApplicationOwner(client);

  if (!applicationOwner) return null;

  return applicationOwner.send(messageCreateOptions);
}
