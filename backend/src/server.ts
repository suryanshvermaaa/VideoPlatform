import app from "./index.ts"

app.listen(env.PORT, () => {
  console.log(`[backend] listening on :${env.PORT} (${isProd ? 'prod' : 'dev'})`);
});
