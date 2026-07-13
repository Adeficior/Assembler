import { parseSemVer } from "@adeficior/data-modifier";
import {
  ensureDir,
  type Logger,
  type PacksConfig,
} from "@adeficior/pack-resolver";
import { $ } from "bun";
import { existsSync } from "node:fs";
import { join } from "node:path";
import type { Options } from "./args";

const referencesRepo = "https://github.com/misode/mcmeta.git";
const neoforgeRepo = "https://github.com/neoforged/NeoForge.git";

export default async function cloneReferences({ pack, dirs, logger }: Options) {
  await ensureDir(dirs.references);

  const config: PacksConfig = {
    packs: {},
  };

  logger.info("cloning references...");

  const promises: Promise<unknown>[] = [
    cloneReference(
      dirs.references,
      referencesRepo,
      "vanilla-assets",
      `${pack.versions.minecraft}-assets-json`,
      logger,
    ),
    cloneReference(
      dirs.references,
      referencesRepo,
      "vanilla-data",
      `${pack.versions.minecraft}-data-json`,
      logger,
    ),
  ];

  if (pack.versions.neoforge) {
    const { major, minor } = parseSemVer(pack.versions.neoforge);
    promises.push(
      cloneReference(
        dirs.references,
        neoforgeRepo,
        "neoforge",
        `${major}.${minor}`,
        logger,
      ),
    );

    config.packs.neoforge = {
      paths: ["src/generated/resources", "src/main/resources"],
    };
  }

  const configFile = Bun.file(join(dirs.references, "config.json"));
  promises.push(configFile.write(JSON.stringify(config, null, 2)));

  await Promise.all(promises);
}

async function cloneReference(
  referencesDir: string,
  repo: string,
  name: string,
  tag: string,
  logger: Logger,
) {
  if (existsSync(join(referencesDir, name))) {
    logger.info(`using cached ${name}`);
    return;
  }

  await $`git clone --depth 1 --branch ${tag} ${repo} ${name}`
    .quiet()
    .cwd(referencesDir);

  logger.info(`cloned ${name}`);
}
