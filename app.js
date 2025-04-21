import express from 'express';
import { json } from 'express';
import {task_add,
        task_complete,
        task_delete,
        task_get_all,
        task_add_tag,
        task_rename,
        task_add_image,
        tid_retrieve_image,
        tid_download_image} from './tasks.js';
import {verifyToken,
        loginUser,
        registerUser,
        refreshUser} from './userController.js';

const app = express();
const port = 3000;

app.use(json());

app.get("/tasks/:page", verifyToken, task_get_all);
app.post("/tasks/", verifyToken, task_add);
app.patch("/tasks/:id", verifyToken, task_complete)
app.delete("/tasks/:tid", verifyToken, task_delete);
app.post("/tasks/:id/tags", verifyToken, task_add_tag);
app.patch("/tasks/:id/rename", verifyToken, task_rename);

app.post("/tasks/:tid/images", verifyToken, task_add_image);
app.get("/tasks/:tid/images", verifyToken, tid_retrieve_image);
app.get("/tasks/:tid/images/download", verifyToken, tid_download_image);

app.post("/register",  registerUser);
app.get("/refresh",  refreshUser);
app.post("/login", loginUser);

app.get('/dashboard', verifyToken, (req, res) => {
        console.log(req.user);
  res.json({ message: `Welcome to the dashboard, ${req.user.email}!` });
});

app.listen(port, () => {
    console.log('Server running at http://localhost:3000');
});
