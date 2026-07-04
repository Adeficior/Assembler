import type { Logger } from "@adeficior/pack-resolver";
import { $ } from "bun";
import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const referencesRepo = "https://github.com/misode/mcmeta.git";

export default async function cloneReferences(
  cacheDir: string,
  version: string,
  logger: Logger,
) {
  if (!version) throw new Error("minecraft version not set");
  const referencesDir = join(cacheDir, "reference");

  if (!existsSync(referencesDir)) mkdirSync(referencesDir);

  logger.info("cloning references...");

  await Promise.all([
    cloneReference(
      referencesDir,
      "vanilla-assets",
      `${version}-assets-json`,
      logger,
    ),
    cloneReference(
      referencesDir,
      "vanilla-data",
      `${version}-data-json`,
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
