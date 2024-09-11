import "dotenv/config";
import bot from "./bot.js";
import api from "./api.js";

await bot();
await api();
