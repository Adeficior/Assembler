import { createLogger } from "@pssbletrngle/data-modifier";
import parseArgs from "arg";
import { existsSync, mkdirSync } from "fs";
import { resolve } from "path";
import { generateResources, mergeResources } from ".";
import { logError } from "./error";
import { loadPack } from "./pack";
import cloneReferences from "./references";

const logger = createLogger();

const args = parseArgs({
  "--generate": Boolean,
  "--merge": Boolean,
  "--resources-dir": String,
  "--pack-dir": String,
  "--modules-dir": String,
  "--cache-dir": String,
  "--fail-fast": Boolean,
});

async function run() {
  const resourcesDir = args["--resources-dir"] ?? "resources";
  const packDir = args["--pack-dir"] ?? "pack";
  const modulesDir = args["--modules-dir"] ?? "gen";
  const cacheDir = args["--cache-dir"] ?? ".assembler";

  if (!existsSync(cacheDir)) mkdirSync(cacheDir);

  const pack = await loadPack(packDir);

  logger.info(`assembling ${pack.name}`);

  if (args["--generate"]) {
    await cloneReferences(cacheDir, pack.versions.minecraft, logger);
    const to = resolve(resourcesDir, "generated");
    await generateResources(modulesDir, cacheDir, to, {
      logger,
      failFast: args["--fail-fast"],
    });
  }

  if (args["--merge"]) {
    await mergeResources(resourcesDir, packDir, { logger });
  }
}

run().catch((e) => {
  logError(logger, e);
  process.exit(1);
});
