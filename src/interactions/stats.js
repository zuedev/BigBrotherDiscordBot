import { SlashCommandBuilder } from "discord.js";
import { findOne } from "../controllers/mongodb.js";

const command = new SlashCommandBuilder()
  .setName("stats")
  .setDescription("Shows some stats about the bot");

/**
 * Shows some stats about the bot.
 *
 * @param {import("discord.js").CommandInteraction} interaction
 *
 * @returns {Promise<import("discord.js").Message>}
 */
const execute = async (interaction) => {
  const statsJson = {
    guilds: interaction.client.guilds.cache.size,
    channels: interaction.client.channels.cache.size,
    users: interaction.client.users.cache.size,
    globalEventsLogged:
      (await findOne("stats", { key: "GLOBAL" })).eventsLogged || 0,
  };

  await interaction.reply({
    content:
      "# Big Brother Bot Stats 📊\n\n```json\n" +
      JSON.stringify(statsJson, null, 2) +
      "\n```",
  });
};

export default {
  command,
  execute,
};
