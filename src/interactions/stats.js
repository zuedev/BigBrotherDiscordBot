import { SlashCommandBuilder } from "discord.js";
import getStat from "../library/getStat.js";

const command = new SlashCommandBuilder()
  .setName("stats")
  .setDescription("Get the stats of the bot!");

const execute = async (interaction) => {
  const stats = {
    channels: interaction.client.channels.cache.size,
    guilds: interaction.client.guilds.cache.size,
    users: interaction.client.users.cache.size,
    uptime: (() => {
      let ms = interaction.client.uptime;
      let seconds = (ms / 1000).toFixed(1);
      let minutes = (ms / (1000 * 60)).toFixed(1);
      let hours = (ms / (1000 * 60 * 60)).toFixed(1);
      let days = (ms / (1000 * 60 * 60 * 24)).toFixed(1);
      if (seconds < 60) return seconds + " Seconds";
      else if (minutes < 60) return minutes + " Minutes";
      else if (hours < 24) return hours + " Hours";
      else return days + " Days";
    })(),
    loggedEvents: await getStat("logJSON_invocations", true),
  };

  let message = "**Stats**\n";
  message += "```json\n";
  message += JSON.stringify(stats, null, 2);
  message += "\n```";

  await interaction.reply(message);
};

export default {
  command,
  execute,
};
