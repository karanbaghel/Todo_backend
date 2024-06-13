const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const connectDB = require("./db/connection");
const User = require("./model/user");
const Todo = require("./model/todo");

const dotenv = require("dotenv");
dotenv.config();
const app = express();

const PORT = process.env.PORT

app.use(cors());
app.use(bodyParser.json());

connectDB()
  .then(() => {
    console.log("Connected to MongoDB");

    app.get("/", (req, res) => {
      res.send("This is the homepage");
    });

    app.post("/register", async (req, res) => {
      const { name, email, password, confirmpassword } = req.body;

      if (password !== confirmpassword) {
        return res.status(400).json({ message: "Passwords do not match" });
      }

      try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          return res.status(400).json({ message: "Email already in use" });
        }

        const newUser = new User({ name, email, password });
        await newUser.save();

        res.status(201).json({ message: "User registered successfully" });
      } catch (err) {
        res
          .status(500)
          .json({ message: "Error registering user", error: err.message });
      }
    });

    app.post("/login", async (req, res) => {
      const { email, password } = req.body;

      try {
        const user = await User.findOne({ email });
        if (!user) {
          return res.status(400).json({ message: "Invalid email or password" });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
          return res.status(400).json({ message: "Invalid email or password" });
        }

        res.status(200).json({ message: "Login successful" });
      } catch (err) {
        res
          .status(500)
          .json({ message: "Error logging in", error: err.message });
      }
    });

    app.get("/api/todos", async (req, res) => {
      try {
        const todos = await Todo.find();
        res.json(todos);
      } catch (err) {
        res.status(500).json({ message: err.message });
      }
    });

    app.post("/api/todos", async (req, res) => {
      const { name, email, address, phoneno } = req.body;

      const newTodo = new Todo({
        name,
        email,
        address,
        phoneno,
      });

      try {
        const savedTodo = await newTodo.save();
        res.status(201).json(savedTodo);
      } catch (err) {
        res.status(400).json({ message: err.message });
      }
    });

    app.get("/api/todos/:id", getTodo, (req, res) => {
      res.json(res.todo);
    });

    // app.put("/api/todos/:id", getTodo, async (req, res) => {
    //   if (req.body.name != null) {
    //     res.todo.name = req.body.name;
    //   }
    //   if (req.body.email != null) {
    //     res.todo.email = req.body.email;
    //   }
    //   if (req.body.address != null) {
    //     res.todo.address = req.body.address;
    //   }
    //   if (req.body.phoneno != null) {
    //     res.todo.phoneno = req.body.phoneno;
    //   }

    //   try {
    //     const updatedTodo = await res.todo.save();
    //     res.json(updatedTodo);
    //   } catch (err) {
    //     res.status(400).json({ message: err.message });
    //   }
    // });

    // app.delete("/api/todos/:id", getTodo, async (req, res) => {
    //   try {
    //     await res.todo.remove();
    //     res.json({ message: "Deleted todo" });
    //   } catch (err) {
    //     res.status(500).json({ message: err.message });
    //   }
    // });
    app.put("/api/todos/:id", async (req, res) => {
      try {
        const { name, email, address, phoneno } = req.body;
        const todo = await Todo.findByIdAndUpdate(req.params.id, { name, email, address, phoneno }, { new: true });
        if (!todo) {
          return res.status(404).json({ message: "Cannot find todo" });
        }
        res.json(todo);
      } catch (err) {
        res.status(400).json({ message: err.message });
      }
    });

    app.delete("/api/todos/:id", async (req, res) => {
      try {
        const todo = await Todo.findByIdAndDelete(req.params.id);
        if (!todo) {
          return res.status(404).json({ message: "Cannot find todo" });
        }
        res.json({ message: "Deleted todo" });
      } catch (err) {
        res.status(500).json({ message: err.message });
      }
    });

    async function getTodo(req, res, next) {
      try {
        const todo = await Todo.findById(req.params.id);
        if (!todo) {
          return res.status(404).json({ message: "Cannot find todo" });
        }
        res.todo = todo.toObject();
        next();
      } catch (err) {
        res.status(500).json({ message: err.message });
      }
    }

    app.listen(process.env.PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err.message);
    process.exit(1);
  });

module.exports = app;
