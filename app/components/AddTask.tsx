//@ts-nocheck

/* 
  Legendary `AddTask` component. 
  P.S. It has a "ts-nocheck" at the head of the file, that's a RED FLAG 🚩! 
*/

// Import needed React methods
import { useState, useRef } from "react";

// Getting Forms and Transition hooks from Remix
import { Form, useTransition } from "remix";

// Getting "Tasks" type from Prisma
import { Tasks } from "@prisma/client";

// Default export ( No comment for now)

/* 
  Chore: 1. Sort out TS "types hell" below.
  Chore: 2. Change the time field to use an actual date object instead of string.
  Chore: 3. Remove "ts-nocheck" and improve UX. 
*/

export default function Add(props: { addTask: (task: Tasks) => void }) {
  const transition = useTransition();

  const [title, setTask] = useState<string>("");
  const [description, setDescription] = useState<string>("");

  const today = new Date();
  var date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
  var time = today.getHours() + ":" + today.getMinutes();
  
  const [deadline, setTime] = useState(date + ' ' + time);

  const submit = () => {
    if (!title || !deadline) {
      alert("You can't submit an empty task!");
    } else {
      props.addTask({ title, description, deadline });
    }
    setTask("");
    setDescription("");
    setTime("");
  };

  return (
    <div>
      <h2>Add Task</h2>
      <Form className="add-form" onSubmit={submit}>
        <div className="form-control">
          <label>Task</label>
          <input
            type="text"
            value={title}
            placeholder="Add Task"
            onChange={(e) => setTask(e.target.value)}
          />
        </div>
        <div className="form-control">
          <label>Description</label>
          <input
            type="text"
            value={description}
            placeholder="Task description...(optional)"
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="form-control">
          <label>Set day & Time</label>
          <input
            type="text"
            value={deadline}
            onChange={(e) => setTime(e.target.value)}
            placeholder="Day & Time"
          />
        </div>
        <input type="submit" value="Save Task" className="btn btn-block" />
      </Form>
    </div>
  );
}
