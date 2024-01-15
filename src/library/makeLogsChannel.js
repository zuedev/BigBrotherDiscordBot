import { ChannelType, PermissionFlagsBits } from "discord.js";
import getLogsChannel from "./getLogsChannel.js";
import { upsert } from "../controllers/mongodb.js";

/**
 * Creates a logs channel for the guild or returns the existing one.
 *
 * @param {import("discord.js").Guild} guild
 *
 * @returns {Promise<import("discord.js").TextChannel>}
 */
export default async function makeLogsChannel(guild) {
  // do we already have a logs channel?
  const existingChannel = await getLogsChannel(guild);

  // if so, return it
  if (existingChannel) return existingChannel;

  // otherwise, create one
  const channel = await guild.channels.create({
    name: "dlb-logs",
    type: ChannelType.GuildText,
    topic: "Logs for the server",
    reason: "Logging bot needs a channel to log stuff",
    permissionOverwrites: [
      {
        id: guild.roles.everyone.id,
        deny: [PermissionFlagsBits.ViewChannel],
      },
      {
        id: process.env.DISCORD_APPLICATION_ID,
        allow: [PermissionFlagsBits.ViewChannel],
      },
    ],
  });

  // save the channel ID to the database
  await upsert("guilds", { id: guild.id }, { logging_channel_id: channel.id });

  // send a message to the channel
  await channel.send(
    `Welcome to your new logs channel! I have saved the channel ID to the database for you so feel free to rename it if you want. I have also locked the channel down so that only myself and admins can see it. If you want to change that, you can do so by editing the channel permissions. If you want to stop logging, you can either run \`/pause\` to pause it temporarily or \`/stop\` to stop it permanently.`
  );

  // return the channel
  return channel;
}
