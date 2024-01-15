import { find } from "../controllers/mongodb.js";

/**
 * Gets a stat from the database.
 *
 * @param {string} statName The name of the stat to get.
 * @param {boolean} [onlyValue=false] Whether to only return the value of the stat.
 *
 * @returns {Promise<object>} The stat.
 */
export default async function getStat(statName, onlyValue = false) {
  const stat = await find("stats", { key: statName });

  if (stat.length === 0) return null;

  if (onlyValue) return stat[0].value;

  return { [stat[0].key]: stat[0].value };
}
