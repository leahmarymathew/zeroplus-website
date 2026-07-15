import { buildApp } from "./app.js";
import { config } from "./config.js";

const app = buildApp();

app.listen(config.port, () => {
  console.log(`Zeroplus API listening on http://localhost:${config.port} (v1 at /v1)`);
});
