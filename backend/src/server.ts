import app from "./index.js"
import { env, isProd } from "./config/env.js";

app.listen(env.PORT, () => {
  console.log(`[backend] listening on :${env.PORT} (${isProd ? 'prod' : 'dev'})`);
});
