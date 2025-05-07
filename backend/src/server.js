import express from "express";
import cors from "cors";
import morgan from "morgan";
import router from "./routes.js";

const app = express();

app.set("trust proxy", true);
app.use(morgan("combined"));
app.use(cors());
app.use(express.json());
app.use(router);

export default app;

// Start the server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Server listening on http://localhost:${PORT}`);
});
