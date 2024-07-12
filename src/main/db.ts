const { MongoClient, ServerApiVersion } = require('mongodb');

const username = encodeURIComponent("mongodbuser");
const password = encodeURIComponent("CDiamUmIszxyJCdw");
const uri = `mongodb+srv://${username}:${password}@toolsdb.hqtevxm.mongodb.net/?retryWrites=true&w=majority&appName=ToolsDB`;

function getClient() {
  const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  });
  return client;
}

export async function dbFindOne(event:any, query: object) {
  const client = getClient();
  const database = client.db('foamsizer');
  const tools = database.collection('tools');
  let result;
  try {
    console.log('query', query);
    result = await tools.findOne(query);
    console.log('result', result);
  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
    return result;
  }
}

export async function dbInsertOne(event:any, data: object) {
  let result;
  const client = getClient();
  const database = client.db('foamsizer');
  const tools = database.collection('tools');
  try {
    result = await tools.insertOne(data);
  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
    return result;
  }
}

export async function dbReplaceOne(event:any, query: object, data: object) {
  let result;
  const client = getClient();
  const database = client.db('foamsizer');
  const tools = database.collection('tools');
  try {
    result = await tools.replaceOne(query, data);
  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
    return result;
  }
}
