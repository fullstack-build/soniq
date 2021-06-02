import { app } from "./app";

app.boot().catch((error) => {
  throw error;
});
