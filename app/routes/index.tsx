/* Index route also the login route in this app. */

// Import needed Remix modules (components).
import {
  useActionData,
  json,
  Link,
  useSearchParams,
  Form
} from "remix";

// Importing our database utility from PrismaClient
import { db } from "~/utils/db.server";

// Importing our needed session methods from session.server

/* 
  Please refer to /app/utils/session.server.ts for more details.
*/

import {
  createUserSession,
  login,
  register
} from "~/utils/session.server";

// Import our remix Ts types
import type { ActionFunction, LinksFunction } from "remix";

// Importing stylesheet
import stylesUrl from "../styles/login.css";

// Link function to handle the style of our current route and making sure it gets 
// implemented in the Remix style stack
export const links: LinksFunction = () => {
  return [{ rel: "stylesheet", href: stylesUrl }];
};

// A simple function to validate out Email from our Form
function validateEmail(email: unknown) {
  if (typeof email !== "string" || !email.includes("@") || !email.includes(".com")) {
    return `Email field must be a valid email!`;
  }
}

// Validating our password field
function validatePassword(password: unknown) {
  if (typeof password !== "string" || password.length < 8) {
    return `Passwords must be at least 8 characters long`;
  }
}

// A simple custom type for our action function's data
type ActionData = {
  formError?: string;
  fieldErrors?: {
    email: string | undefined;
    password: string | undefined;
  };
  fields?: {
    loginType: string;
    email: string;
    password: string;
  };
};

// A function to handle Bad Request and the response status
const badRequest = (data: ActionData) =>
  json(data, { status: 400 });

// Action function for the login route
export const action: ActionFunction = async ({
  request
}) => {
  // Getting our form data and "destructuring" it
  const form = await request.formData();
  const loginType = form.get("loginType");
  const email = form.get("email");
  const password = form.get("password");
  const redirectTo = form.get("redirectTo") || "/task-tracker";

  // First validation check for our Form
  if (
    typeof loginType !== "string" ||
    typeof email !== "string" ||
    typeof password !== "string" ||
    typeof redirectTo !== "string"
  ) {
    return badRequest({
      formError: `Form not submitted correctly.`
    });
  }

  // Checking if our email & password is valid
  const fields = { loginType, email, password };
  const fieldErrors = {
    email: validateEmail(email),
    password: validatePassword(password)
  };
  if (Object.values(fieldErrors).some(Boolean))
    return badRequest({ fieldErrors, fields });

    // Switch statement to handle our loginType and their respective methods
    switch (loginType) {
      case "login": {
        const user = await login({ email, password });
        if (!user) {
          return badRequest({
            fields,
            formError: `Username/Password combination is incorrect`
          });
        }
        return createUserSession(user.id, redirectTo);
      }
      case "register": {
        const userExists = await db.user.findFirst({
          where: { email }
        });
        if (userExists) {
          return badRequest({
            fields,
            formError: `User with email ${email} already exists`
          });
        }
        const user = await register({ email, password });
        if (!user) {
          return badRequest({
            fields,
            formError: `Something went wrong trying to create a new user.`
          });
        }
        return createUserSession(user.id, redirectTo);
      }
      default: {
        return badRequest({
          fields,
          formError: `Login type invalid`
        });
      }
  }
};

export default function Login() {
  const actionData = useActionData<ActionData>();
  const [searchParams] = useSearchParams();
  return (
    <div className="container">
      <div className="content" data-light="">
        <h1>Login</h1>
        <Form
          method="post"
          aria-describedby={
            actionData?.formError
              ? "form-error-message"
              : undefined
          }
        >
          <input
            type="hidden"
            name="redirectTo"
            value={
              searchParams.get("redirectTo") ?? undefined
            }
          />
          <fieldset>
            <legend className="sr-only">
              Login or Register?
            </legend>
            <label>
              <input
                type="radio"
                name="loginType"
                value="login"
                defaultChecked={
                  !actionData?.fields?.loginType ||
                  actionData?.fields?.loginType === "login"
                }
              />{" "}
              Login
            </label>
            <label>
              <input
                type="radio"
                name="loginType"
                value="register"
                defaultChecked={
                  actionData?.fields?.loginType ===
                  "register"
                }
              />{" "}
              Register
            </label>
          </fieldset>
          <div className="input">
            <label htmlFor="email-input">Email</label>
            <input
              type="text"
              id="email-input"
              name="email"
              placeholder="Enter your Email"
              defaultValue={actionData?.fields?.email}
              aria-invalid={Boolean(
                actionData?.fieldErrors?.email
              )}
              aria-describedby={
                actionData?.fieldErrors?.email
                  ? "email-error"
                  : undefined
              }
            />
            {actionData?.fieldErrors?.email ? (
              <p
                className="form-validation-error"
                role="alert"
                id="email-error"
              >
                {actionData?.fieldErrors.email}
              </p>
            ) : null}
          </div>
          <div className="input">
            <label htmlFor="password-input">Password</label>
            <input
              id="password-input"
              name="password"
              defaultValue={actionData?.fields?.password}
              type="password"
              placeholder="* * * * * * * *"
              aria-invalid={
                Boolean(
                  actionData?.fieldErrors?.password
                ) || undefined
              }
              aria-describedby={
                actionData?.fieldErrors?.password
                  ? "password-error"
                  : undefined
              }
            />
            {actionData?.fieldErrors?.password ? (
              <p
                className="form-validation-error"
                role="alert"
                id="password-error"
              >
                {actionData?.fieldErrors.password}
              </p>
            ) : null}
          </div>
          <div id="form-error-message">
            {actionData?.formError ? (
              <p
                className="form-validation-error"
                role="alert"
              >
                {actionData?.formError}
              </p>
            ) : null}
          </div>
          <button type="submit" className="button">
            Submit
          </button>
        </Form>
      </div>
    </div>
  );
}