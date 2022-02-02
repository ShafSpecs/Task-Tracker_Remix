/* `task-tracker` route */

// Import needed Reac methods
import { useEffect, useState } from "react";

// Remix's needed methods and components
import {
  Form,
  json,
  Link,
  redirect,
  useLoaderData,
  useFetcher,
  useTransition,
} from "remix";

// Importing our database types from prisma
import { User, Tasks } from "@prisma/client";

// Importing our db instance from PrismaClient
import { db } from "~/utils/db.server";

// Importing the function to get a user based on session's request
import { getUser } from "../utils/session.server";

// A simple icon from react-icons lib 🤷‍♂️
import { RiDeleteBin5Line } from "react-icons/ri";

// AddTask component
import Add from "~/components/AddTask";

// An SVG to spice up the app a bit
import svg from "../svg/todo_empty.svg";

// Remix needed TS types
import type { LinksFunction, ActionFunction, LoaderFunction } from "remix";

// Importing our stylesheets
import styles from "../styles/task-tracker.css";

// A custom type for our locale task
type LocaleTask = {
  id: string;
  task: string;
  description?: string;
  time: string;
};

// Link function for our task-tracker route
export const links: LinksFunction = () => {
  return [{ rel: "stylesheet", href: styles }];
};

// Action function for our route
export const action: ActionFunction = async ({ request }) => {
  // First thing is get the user and if not found, kick out of route
  const user = await getUser(request);
  if (!user) {
    return redirect("/");
  }

  // If the first check goes smoothly, get our Form inputs 
  const body = await request.formData();

  // Check out which Form is submitting right now by comparing a unique value
  if (body.get("_action") === "add") {
    // If it's the add form, create the task in the current user table
    const newTask = await db.tasks.create({
      data: {
        //@ts-ignore
        title: body.get("title"),
        //@ts-ignore
        description: body.get("desc"),
        //@ts-ignore
        deadline: body.get("deadline"),
        userId: user.id,
      },
    });
  } else if (body.get("_action") === "delete") {
    // If it's the delete form, delete the task from the current user table 
    const task = await db.tasks.delete({
      where: {
        //@ts-ignore
        id: body.get("id"),
      },
    });
  }

  // A nonsensical return message. [Chore: Remove & replace this]
  return { message: "Hello" };
};

// Our loader function for this route
export const loader: LoaderFunction = async ({ request }) => {
  // User session validation
  const user = getUser(request);
  if (!user) {
    return redirect("/");
  }

  // Get all tasks of current user.
  const dbTasks = db.tasks.findMany({
    where: {
      // @ts-ignore
      userId: user.id,
    },
    select: {
      id: true,
      title: true,
      description: true,
      deadline: true,
    },
  });

  // Return the tasks as an array
  return dbTasks;
};

// Deleted Task component 👇
const DeletedTask = ({ getTask }: any) => {
  const transition = useTransition();
  return (
    <div className="task done">
      <h3 className="task-title">{getTask.title}</h3>
      <p className="task-description">{getTask.description}</p>
      <p className="task-time">{getTask.deadline}</p>
    </div>
  )
};

// The collective of "DeleteTask" components
const DeletedTasks = ({ tasks }: any) => {
  return (
    <>
      {tasks.map((getTask: LocaleTask) => (
        <DeletedTask key={getTask.id} getTask={getTask} />
      ))}
    </>
  );
};

// Our App's Nav (Header)
const Nav = () => {
  return (
    <nav>
      <h1 className="title">🏃‍♂️ Get it Done</h1>
      <div>
        <span>Hello there 👋</span>
        <Link to="/logout">
          <button className="profile">Sign Out</button>
        </Link>
      </div>
    </nav>
  );
};

// Default export for this route
export default function TaskTracker() {
  // Get our loader's data
  const data = useLoaderData();

  // Destructure the data
  const dbTasks = data;

  // Initialize the Remix fetcher hook (it's magic 🧙‍♂️!)
  const fetcher = useFetcher();

  // Transition hook for building optimistic UI
  const transition = useTransition();

  // State to handle our `AddTask` component's visibility
  const [showAddSection, setShowAddSection] = useState<boolean>(false);

  // An empty array to hold the user's tasks 
  const [tasks, setTasks] = useState<Tasks[]>([]);

  // A useEffect hook to get the user's tasks
  /* 
    Chore: Add this to the possible list of cause-of-lag suspect 
  */
  useEffect(() => {
    setTasks([]);
    dbTasks.map((task: Tasks) => {
      setTasks((prevTasks) => [...prevTasks, task]);
    });
  }, [dbTasks]);

  // Our done tasks array (state)
  const [doneTasks, setDone] = useState<Tasks[]>([]);

  // Function to handle addition of new tasks to our user's array of taks
  const addTask = (task: Tasks) => {
    setTasks([...tasks, task]);
    fetcher.submit(
      {
        _action: "add",
        title: task.title,
        //@ts-ignore
        desc: task.description,
        //@ts-ignore
        deadline: task.deadline,
      },
      { method: "post" }
    );
  };

  // Function to handle deletion of tasks
  const deleteTask = (id: string | undefined): void => {
    for (let i = 0; i < tasks.length; i++) {
      if (tasks[i].id === id) {
        setDone([...doneTasks, tasks[i]]);
        break;
      }
    }
    setTasks(tasks.filter((tasks) => tasks.id !== id));

    // _Observation: "ts-ignore" has become rampant at this point (👆 & 👇)

    //@ts-ignore
    fetcher.submit({ _action: "delete", id }, { method: "post" });
  };

  // A simple function to toggle visibility of the `AddTaskSection` component
  const toggleShow = (): void => {
    setShowAddSection(!showAddSection);
  };

  /* 
    Chore: Comment on what the whole crap ton of conditionals are doing below 👇
  */
 
  return (
    <div>
      <Nav />
      <div className="container">
        {(tasks.length > 0 || showAddSection) && (
          <header className="header">
            <h1>Task Tracker</h1>
            <button
              className="btn"
              style={
                showAddSection
                  ? { backgroundColor: "#f11" }
                  : { backgroundColor: "#000" }
              }
              onClick={toggleShow}
            >
              {showAddSection ? "Close" : "Add"}
            </button>
          </header>
        )}
        {showAddSection && <Add addTask={addTask} />}
        {dbTasks.length > 0 ? (
          <div className="task-section">
            {dbTasks.map((task: Tasks) => (
              <div className="task" key={task.id}>
                <h3 className="task-title">{task.title}</h3>
                <p className="task-description">{task.description}</p>
                <p className="task-time">{task.deadline}</p>
                <RiDeleteBin5Line
                  className="delete-icon"
                  onClick={() => deleteTask(task.id)}
                />
              </div>
            ))}
          </div>
        ) : (
          <div>
            {!showAddSection && (
              <div>
                <img
                  src={svg}
                  style={{ width: "80%", height: "80%" }}
                  alt="Todo Image"
                />
                <div className="no-task">
                  <p className="no-task-text">No Task added yet!</p>
                  <button className="no-task-btn" onClick={toggleShow}>
                    Add Task
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        {doneTasks.length > 0 && (
          <div className="done-tasks">
            <h2>Done Tasks</h2>
            <div>
              <DeletedTasks tasks={doneTasks} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
