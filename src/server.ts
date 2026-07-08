import dotenv from "dotenv";
dotenv.config();

import app from "./app";

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✅ Server ${PORT}-portda ishga tushdi`);
  console.log(`📚 Swagger docs: http://localhost:${PORT}/api-docs`);
});
