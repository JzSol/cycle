import { MongoClient } from "mongodb";

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

const isValidMongoUri = (value?: string): value is string => {
  return Boolean(
    value?.startsWith("mongodb://") || value?.startsWith("mongodb+srv://")
  );
};

export const getMongoClientPromise = () => {
  const uri = process.env.MONGODB_URI;
  if (!isValidMongoUri(uri)) {
    throw new Error(
      "Invalid MONGODB_URI. It must start with mongodb:// or mongodb+srv://"
    );
  }

  if (process.env.NODE_ENV === "development") {
    if (!global._mongoClientPromise) {
      const client = new MongoClient(uri);
      global._mongoClientPromise = client.connect();
    }
    return global._mongoClientPromise;
  }

  const client = new MongoClient(uri);
  return client.connect();
};

