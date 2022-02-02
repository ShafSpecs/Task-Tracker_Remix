/* 
  Our db "handler", connects to our Prisma Client and allows 
  seamless connection from client to server to db
*/

// Import PrismaClient 
import { PrismaClient } from "@prisma/client";

// Create a new instance of our Prisma Client
let db: PrismaClient;

declare global {
  var __db: PrismaClient | undefined;
}

// Check wether we are in development or production and set the db accordingly,
// hence we disable the connection limits in development each time we refresh our app
if (process.env.NODE_ENV === "production") {
  db = new PrismaClient();
  db.$connect();
} else {
  if (!global.__db) {
    global.__db = new PrismaClient();
    global.__db.$connect();
  }
  db = global.__db;
}

// Export our db instance
export { db };