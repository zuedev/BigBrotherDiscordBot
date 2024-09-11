import { MongoClient } from "mongodb";

/**
 * Connects to the database.
 * This is called automatically by other functions.
 * You should not need to call this manually.
 *
 * @returns {Promise<MongoClient>} The connected MongoDB client
 */
export async function connect() {
  const mongo = new MongoClient(process.env.MONGODB_URI);

  await mongo.connect();

  return mongo;
}

/**
 * Finds an object in the database.
 *
 * @param {string} table The table to get from
 * @param {object} filter The filter to use
 *
 * @returns {Promise<object>} The object
 */
export async function findOne(table, filter) {
  const mongo = await connect();

  const data = await mongo.db().collection(table).findOne(filter);

  await mongo.close();

  return data;
}

/**
 * Updates an object in the database.
 *
 * @param {string} table The table to update
 * @param {object} filter The filter to use
 * @param {object} update The update to use
 *
 * @returns {Promise<object>} The object
 */
export async function updateOne(table, filter, update, options) {
  const mongo = await connect();

  const data = await mongo
    .db()
    .collection(table)
    .updateOne(filter, update, options);

  await mongo.close();

  return data;
}

export default { connect, findOne, updateOne };
