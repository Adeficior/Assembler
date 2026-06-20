import { createLogger } from "@pssbletrngle/data-modifier";
import parseArgs from "arg";
import { logError } from "./error";
import mergeResources from "./merge";
import modifyResources from "./modifier";

const logger = createLogger();

const args = parseArgs({
  "--generate": String,
  "--merge": Boolean,
  "--fail-fast": Boolean,
});

async function run() {
  if (args["--generate"]) {
    const from = args["--generate"];
    await modifyResources(from, { logger, failFast: args["--fail-fast"] });
  }

  if (args["--merge"]) {
    await mergeResources({ logger });
  }
}

run().catch((e) => {
  logError(logger, e);
  process.exit(1);
});
