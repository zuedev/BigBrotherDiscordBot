import { MongoClient } from "mongodb";

/**
 * Connects to the database.
 * This is called automatically by other functions.
 * You should not need to call this manually.
 *
 * @returns {Promise<MongoClient>} The connected MongoDB client
 */
export async function connect() {
  const mongo = new MongoClient(process.env.MONGODB_URI, {
    retryWrites: true,
    writeConcern: "majority",
  });

  await mongo.connect();

  return mongo;
}

/**
 * Finds objects in the database that match the filter.
 * If no filter is provided, it will return all objects.
 *
 * @param {string} table The table to find from
 * @param {object} filter The filter to use
 *
 * @returns {Promise<object[]>} The found objects
 *
 * @example find("users", { id: "123" });
 */
export async function find(table, filter) {
  const mongo = await connect();

  const data = await mongo.db().collection(table).find(filter).toArray();

  await mongo.close();

  return data || [];
}

/**
 * Updates an object in the database, or inserts it if it doesn't exist.
 *
 * @param {string} table The table to update
 * @param {object} filter The filter to use
 *
 * @returns {Promise<object>} The updated object
 *
 * @example update("users", { id: "123" }, { name: "Bob" });
 */
export async function upsert(table, filter, object) {
  const mongo = await connect();

  const data = await mongo.db().collection(table).updateMany(
    filter,
    {
      $set: object,
    },
    { upsert: true }
  );

  await mongo.close();

  return data;
}

/**
 * Deletes objects in the database that match the filter.
 * If no filter is provided, it will delete all objects.
 *
 * @param {string} table The table to delete from
 * @param {object} filter The filter to use
 *
 * @returns {Promise<object>} The deleted objects
 *
 * @example remove("users", { id: "123" });
 */
export async function remove(table, filter) {
  const mongo = await connect();

  const data = await mongo.db().collection(table).deleteMany(filter);

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

export default { connect, find, upsert, remove, increment };
