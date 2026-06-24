import dotenv from "dotenv";
import { connectDB } from "../config/db.js";
import { seedDatabase } from "./seed.js";

dotenv.config();

connectDB()
  .then(async () => {
    await seedDatabase();
    process.exit(0);
  })
  .catch((err) => {
    console.error("Seeding failed:", err);
    process.exit(1);
  });
