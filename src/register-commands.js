import "dotenv/config";
import { REST, Routes } from "discord.js";
import fs from "fs";

const rest = new REST({ version: "10" }).setToken(
  process.env.DISCORD_BOT_TOKEN
);

await (async () => {
  try {
    let interactions = [];

    for (const interactionFile of fs.readdirSync("./src/interactions/")) {
      const interaction = await import(`./interactions/${interactionFile}`);

      interactions.push(interaction.default.command.toJSON());
    }

    if (process.env.DISCORD_DEVELOPMENT_GUILD_ID) {
      // prepend interactions with dev-
      interactions = interactions.map((interaction) => {
        interaction.name = `dev-${interaction.name}`;
        return interaction;
      });

      await rest.put(
        Routes.applicationGuildCommands(
          process.env.DISCORD_APPLICATION_ID,
          process.env.DISCORD_DEVELOPMENT_GUILD_ID
        ),
        {
          body: interactions,
        }
      );

      console.log("Successfully registered development guild commands.");
    } else {
      await rest.put(
        Routes.applicationCommands(process.env.DISCORD_APPLICATION_ID),
        {
          body: interactions,
        }
      );

      console.log("Successfully registered application commands.");
    }
  } catch (error) {
    console.error(error);
  }
})();
