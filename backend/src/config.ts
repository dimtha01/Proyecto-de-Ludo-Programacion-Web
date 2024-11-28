import dotenv from "dotenv";

/**
 * Sólo leerá las variables de entorno en desarollo...
 * Se deben configurar en el servicio en el que sea desplegado...
 */
if (process.env.NODE_ENV !== "production") {
  dotenv.config();
}

const CONFIG = {
  MONGO_URL: process.env.MONGO_URL || "",
  REDIS_URL: process.env.REDIS_URL || "",
  SESSION_SECRET: process.env.SESSION_SECRET || "",
  GITHUB: {
    KEY: process.env.GITHUB_KEY || "",
    SECRET: process.env.GITHUB_SECRET || "",
  },
  GOOGLE: {
    KEY: process.env.GOOGLE_KEY || "",
    SECRET: process.env.GOOGLE_SECRET || "",
  },
};

export default CONFIG;
