import { MongoClient, ServerApiVersion } from "mongodb";

/**
 * Connects to the database.
 * This is called automatically by other functions.
 * You should not need to call this manually.
 *
 * @returns {Promise<MongoClient>} The connected MongoDB client
 */
export async function connect() {
  const mongo = new MongoClient(process.env.MONGODB_URI, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  });

  await mongo.connect();

  return mongo;
}

/**
 * Gets an object from the database.
 *
 * @param {string} table The table to get from
 * @param {object} filter The filter to use
 *
 * @returns {Promise<object>} The object
 */
export async function get(table, filter) {
  const mongo = await connect();

  const data = await mongo.db().collection(table).findOne(filter);

  await mongo.close();

  return data;
}

/**
 * Increments an object in the database, or inserts it if it doesn't exist.
 *
 * @param {string} table The table to update
 * @param {object} filter The filter to use
 * @param {object} object The object to increment
 *
 * @returns {Promise<object>} The updated object
 *
 * @example increment("users", { id: "123" }, { count: 1 });
 */
export async function increment(table, filter, object) {
  const mongo = await connect();

  const data = await mongo.db().collection(table).updateMany(
    filter,
    {
      $inc: object,
    },
    { upsert: true }
  );

  await mongo.close();

  return data;
}

export default { connect, get, increment };
