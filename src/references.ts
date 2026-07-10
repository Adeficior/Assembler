import { ensureDir, type Logger } from "@adeficior/pack-resolver";
import { $ } from "bun";
import { existsSync } from "node:fs";
import { join } from "node:path";
import type { Options } from "./args";

const referencesRepo = "https://github.com/misode/mcmeta.git";

export default async function cloneReferences({ pack, dirs, logger }: Options) {
  await ensureDir(dirs.references);

  logger.info("cloning references...");

  await Promise.all([
    cloneReference(
      dirs.references,
      "vanilla-assets",
      `${pack.versions.minecraft}-assets-json`,
      logger,
    ),
    cloneReference(
      dirs.references,
      "vanilla-data",
      `${pack.versions.minecraft}-data-json`,
      logger,
    ),
  ]);
}

async function cloneReference(
  referencesDir: string,
  name: string,
  tag: string,
  logger: Logger,
) {
  if (existsSync(join(referencesDir, name))) {
    logger.info(`using cached ${name}`);
    return;
  }

  await $`git clone --depth 1 --branch ${tag} ${referencesRepo} ${name}`
    .quiet()
    .cwd(referencesDir);

  logger.info(`cloned ${name}`);
}
