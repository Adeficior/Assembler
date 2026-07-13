import { PackLoader } from "@adeficior/data-modifier";
import {
  type Acceptor,
  cachedAcceptor,
  createCombinedResolver,
  createResolver,
  distributedAcceptor,
  simpleAcceptor,
  writeToFolder,
} from "@adeficior/pack-resolver";
import { exists, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "path";
import type { Options } from "../args";
import loadModules from "./loader";

async function createOutput(
  output: string,
  cacheDir: string,
): Promise<Acceptor> {
  const cacheFile = join(cacheDir, "cache");
  const writeToGenerated = await cachedAcceptor(
    writeToFolder(output),
    cacheFile,
    async (orphans) => {
      const realPaths = orphans.map((it) => resolve(output, it));
      await Promise.all(realPaths.map((it) => rm(it)));
    },
  );

  // TODO can be folder acceptor?
  const writeToConfig = simpleAcceptor(async (path, content) => {
    await writeFile(join("..", "config", path), (await content).toString());
  });

  return distributedAcceptor(
    {
      "jei/**": writeToConfig,
    },
    writeToGenerated,
  );
}

export default async function generateResources({
  dirs,
  logger,
  pack,
  packFormat,
  failFast,
}: Options) {
  const resolver = await createCombinedResolver({
    from: [join(dirs.install, "mods"), dirs.references],
    logger,
  });

  const output = await createOutput(dirs.generated, dirs.cache);

  // TODO pass options in
  const loader = new PackLoader(logger, {
    packFormat,
    hideFrom: ["jei"],
  });

  // TODO move to loader
  loader.registerRegistry("minecraft:worldgen/biome");

  const dumpDir = resolve("dump");
  if (await exists(dumpDir)) {
    const dump = await createResolver({ from: dumpDir, logger });
    await loader.loadRegistryDump(dump);
  } else {
    logger.warn("dump directory is missing, ID validation disabled");
  }

  logger.info("loading resources...");
  await loader.loadFrom(resolver);

  logger.info("loading modules...");
  await loadModules(loader, dirs.modules, { logger, failFast });

  logger.info("generating modified resources...");
  await loader.emit(output, { description: `${pack.name} resources` });
}
