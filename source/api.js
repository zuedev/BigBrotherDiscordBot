import express from "express";
import cors from "cors";
import { findOne } from "./controllers/mongodb.js";

export default async () => {
  const app = express();

  app.use(cors());

  app.get("/", async (request, response) => {
    response.send({
      message: "Hello, World!",
    });
  });

  app.get("/stats", async (request, response) => {
    const statsJson = {
      guilds: discord.guilds.cache.size,
      channels: discord.channels.cache.size,
      users: discord.users.cache.size,
    };

    if (process.env.MONGODB_URI)
      statsJson.globalEventsLogged =
        (await findOne("stats", { key: "GLOBAL" }))?.eventsLogged || 0;

    response.send(statsJson);
  });

  app.listen(process.env.WEB_API_PORT || 3000, () => {
    console.log(`Listening on port ${process.env.WEB_API_PORT || 3000}!`);
  });
};
