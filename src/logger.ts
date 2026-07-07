import type { Logger } from "@adeficior/pack-resolver";
import { join } from "node:path";
import winston from "winston";

export default async function createLogger(folder: string) {
  return winston.createLogger({
    level: "info",
    format: winston.format.simple(),
    transports: [
      new winston.transports.File({
        options: { flags: "w" },
        level: "debug",
        filename: join(folder, "debug.log"),
      }),
      //  new winston.transports.File({
      //    options: { flags: "w" },
      //    level: "trace",
      //    filename: join(logFolder, "trace.log"),
      //  }),
      new winston.transports.Console(),
    ],
    levels: {
      ...winston.config.cli.levels,
      trace: 9,
    },
  }) as unknown as Logger;
}
