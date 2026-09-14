import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const wipeData = async () => {
  try {
    const MONGO_URI = process.env.MONGO_URI;
    if (!MONGO_URI) {
      console.error("No MONGO_URI found in .env");
      process.exit(1);
    }
    await mongoose.connect(MONGO_URI);
    console.log("Connected to DB, starting data wipe...");

    const collections = await mongoose.connection.db.collections();
    for (let collection of collections) {
      console.log(`Dropping collection: ${collection.collectionName}`);
      await collection.drop();
    }
    
    console.log("All collections dropped successfully. Database is completely wiped.");
    process.exit(0);
  } catch (error) {
    console.error("Error wiping data:", error);
    process.exit(1);
  }
};

wipeData();
