import { ensureDir } from "@adeficior/pack-resolver";
import parseArgs from "arg";
import { join } from "node:path";
import createLogger from "./logger";
import { loadPack } from "./pack";

export type CliAction = "merge" | "generate" | "prepare" | "publish";
const subCommands: CliAction[] = ["prepare", "publish"];

export default async function getArguments() {
  const args = parseArgs({
    "--generate": Boolean,
    "--merge": Boolean,
    "--resources-dir": String,
    "--pack-dir": String,
    "--modules-dir": String,
    "--cache-dir": String,
    "--fail-fast": Boolean,
    "--project-id": String,
  });

  const resourcesDir = args["--resources-dir"] ?? "resources";
  const packDir = args["--pack-dir"] ?? "pack";
  const modulesDir = args["--modules-dir"] ?? "gen";
  const cacheDir = args["--cache-dir"] ?? ".assembler";
  const logFolder = join(cacheDir, "logs");
  const generatedOutput = join(cacheDir, "generated");

  const failFast = args["--fail-fast"];

  const actions: CliAction[] = [];

  const [action] = args._ as [CliAction];

  await ensureDir(cacheDir);

  if (action) {
    if (subCommands.includes(action)) actions.push(action);
    else throw new Error(`unknown subcommand '${action}'`);
  } else {
    if (args["--generate"]) actions.push("generate");
    if (args["--merge"]) actions.push("merge");
  }

  const logger = await createLogger(logFolder);
  const pack = await loadPack(packDir, logger);

  return {
    resourcesDir,
    packDir,
    modulesDir,
    cacheDir,
    actions,
    generatedOutput,
    failFast,
    pack,
    logger,
    modrinth: {
      projectId: args["--project-id"],
      token: process.env.MODRINTH_TOKEN,
    },
  };
}
