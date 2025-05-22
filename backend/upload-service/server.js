import "dotenv/config";
import express from "express"

const app = express()


app.use(express.json())


import router from "./uploadRoutes.js";
app.use(router)

app.listen(3003, () => {
    console.log("listening on port 3000");
  });
  