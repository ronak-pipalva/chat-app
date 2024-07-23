import dotenv from "dotenv";
dotenv.config();

const config = {
  port: process.env.PORT || 3333,
  mongodbConnectionUrl: process.env.MONGODB_CONNECTION_STRING,
  tokenSecret: process.env.TOKEN_SECRET,
  adminSecretKey: process.env.ADMIN_SECRET_KEY,
};

export default config;
