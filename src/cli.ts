#!/usr/bin/env bun

import { packFormatOf } from "@adeficior/data-modifier";
import { generateDumpTypes } from "@adeficior/data-modifier/cli";
import {
  combineResolvers,
  createCombinedResolver,
  createResolver,
  type Logger,
  type Resolver,
} from "@adeficior/pack-resolver";
import parseArgs from "arg";
import { existsSync, mkdirSync } from "fs";
import { join } from "path";
import winston from "winston";
import { generateResources, mergeResources } from ".";
import { loadPack } from "./pack";
import cloneReferences from "./references";
import { generateGlobalTypes } from "./types";

const args = parseArgs({
  "--generate": Boolean,
  "--prepare": Boolean,
  "--merge": Boolean,
  "--resources-dir": String,
  "--pack-dir": String,
  "--modules-dir": String,
  "--cache-dir": String,
  "--fail-fast": Boolean,
});

const resourcesDir = args["--resources-dir"] ?? "resources";
const packDir = args["--pack-dir"] ?? "pack";
const modulesDir = args["--modules-dir"] ?? "gen";
const cacheDir = args["--cache-dir"] ?? ".assembler";
const logFolder = join(cacheDir, "logs");

const logger = winston.createLogger({
  level: "info",
  format: winston.format.simple(),
  transports: [
    new winston.transports.File({
      options: { flags: "w" },
      level: "debug",
      filename: join(logFolder, "debug.log"),
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

if (args["--prepare"]) {
  const typesDir = join(cacheDir, "@types");
  await Promise.all([
    generateGlobalTypes(typesDir, logger),
    generateDumpTypes("dump", typesDir, logger),
  ]);
  process.exit(0);
}

if (!existsSync(cacheDir)) mkdirSync(cacheDir);

const pack = await loadPack(packDir, logger);

const packFormat = packFormatOf(pack.versions.minecraft);

logger.info(`assembling ${pack.name}`);

const generatedOutput = join(cacheDir, "generated");

if (args["--generate"]) {
  await cloneReferences(cacheDir, pack.versions.minecraft, logger);
  await generateResources(modulesDir, cacheDir, generatedOutput, {
    logger,
    packFormat,
    failFast: args["--fail-fast"],
  });
}

if (args["--merge"]) {
  // TODO mergingAcceptor
  const resolvers: Resolver[] = [];
  if (existsSync(resourcesDir))
    resolvers.push(createCombinedResolver({ from: resourcesDir, logger }));
  if (existsSync(generatedOutput))
    resolvers.push(createResolver({ from: generatedOutput, logger }));

  if (resolvers.length === 0) {
    throw new Error("no resources to merge");
  }

  await mergeResources(combineResolvers(resolvers), packDir, { cacheDir });
}

logger.info("Done!");
process.exit(0);
