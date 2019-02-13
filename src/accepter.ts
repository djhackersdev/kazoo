import express = require("express");
import morgan = require("morgan");

const app = express();

app.use(morgan("dev"));

export default app;
