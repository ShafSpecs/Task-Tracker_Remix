/* Util server file to handl;e our auth methods plus session monitoring */

// Importing our Hasher, bcryptjs
import bcrypt from "bcryptjs";

// Importing our already setup Prisma Client module
import { db } from '~/utils/db.server';

// Import Cookie methods from Remix
import {
  createCookieSessionStorage,
  redirect
} from "remix";

// TS types for our login and sign up authentication methods
type LoginForm = {
  email: string;
  password: string;
  icon?: string;
};

// Asynchronous function for registering new user
export async function register({
  email,
  password,
  icon
}: LoginForm) {
  // Hash the password to be saved in the db
  password = await bcrypt.hash(password, 10);

  // Returned a newly created user
  return db.user.create({
    data: { email, password, icon }
  });
}

// Login function for our registered user
export async function login({
  email,
  password
}: LoginForm) {
  // Locate the user based on the unique field, "email"
  const user = await db.user.findUnique({
    where: { email }
  });

  // If the user is not found in the db, return null
  if (!user) return null;

  // If the user is found, compare & check if the password is correct
  const isCorrectPassword = await bcrypt.compare(
    password,
    user.password
  );

  // Password is wrong? Return a null
  if (!isCorrectPassword) return null;

  // If everything goes well, give us back the user info and access
  return user;
}

// Set a new SESSION_SECRET from our env variable
const sessionSecret = process.env.SESSION_SECRET;

// If the SESSION_SECRET isn't found, throw an error
if (!sessionSecret) {
  throw new Error("SESSION_SECRET must be set");
}

// Create a new CookieSessionStorage with our SESSION_SECRET
const storage = createCookieSessionStorage({
  cookie: {
    name: "RJ_session",
    secure: true,
    secrets: [sessionSecret],
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
    httpOnly: true
  }
});

// Allow getting our set user sessions based on our set cookie
export function getUserSession(request: Request) {
  return storage.getSession(request.headers.get("Cookie"));
}

// Get the ID of our user from our session
export async function getUserId(request: Request) {
  const session = await getUserSession(request);
  const userId = session.get("userId");
  if (!userId || typeof userId !== "string") return null;
  return userId;
}

// Methods to require a user to be logged in (validation step)
export async function requireUserId(
  request: Request,
  redirectTo: string = new URL(request.url).pathname
) {
  const session = await getUserSession(request);
  const userId = session.get("userId");
  if (!userId || typeof userId !== "string") {
    const searchParams = new URLSearchParams([
      ["redirectTo", redirectTo]
    ]);
    throw redirect(`/?${searchParams}`);
  }
  return userId;
}

// Return the full user from our db 
export async function getUser(request: Request) {
  const userId = await getUserId(request);

  // Validation check for our user ID
  if (typeof userId !== "string") {
    return null;
  }

  try {
    // Get our User based on ID
    const user = await db.user.findUnique({
      where: { id: userId }
    });
    return user;
  } catch {
    // If error, kick to the login page and delete session
    throw logout(request);
  }
}

// Our logout function
export async function logout(request: Request) {
  // Get our session cookie
  const session = await storage.getSession(
    request.headers.get("Cookie")
  );

  // Return to login page and destroy current session
  return redirect("/", {
    headers: {
      "Set-Cookie": await storage.destroySession(session)
    }
  });
}

// Create a new user session with user ID as our benchmark
export async function createUserSession(
  userId: string,
  redirectTo: string
) {
  const session = await storage.getSession();
  session.set("userId", userId);
  return redirect(redirectTo, {
    headers: {
      "Set-Cookie": await storage.commitSession(session)
    }
  });
}