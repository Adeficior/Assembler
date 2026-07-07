import { PackLoader } from "@adeficior/data-modifier";
import {
  type Acceptor,
  cachedAcceptor,
  createCombinedResolver,
  createLogger,
  createResolver,
  distributedAcceptor,
  simpleAcceptor,
  writeToFolder,
} from "@adeficior/pack-resolver";
import { exists, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "path";
import type { Pack } from "../pack";
import loadModules, { type LoadOptions } from "./loader";

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

const defaultOptions = {
  logger: createLogger(),
  failFast: true,
} satisfies Partial<LoadOptions>;

export default async function generateResources(
  modulesDir: string,
  cacheDir: string,
  to: string,
  options: Partial<LoadOptions> & Pick<LoadOptions, "packFormat">,
  pack: Pack,
) {
  const resolvedOptions: LoadOptions = {
    ...defaultOptions,
    ...options,
  };

  const { logger } = resolvedOptions;

  const resolver = await createCombinedResolver({
    from: [join(cacheDir, "install", "mods"), join(cacheDir, "reference")],
    logger,
  });

  const output = await createOutput(to, cacheDir);

  // TODO pass options in
  const loader = new PackLoader(logger, {
    packFormat: resolvedOptions.packFormat,
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
  await loadModules(loader, modulesDir, resolvedOptions);

  logger.info("generating modified resources...");
  await loader.emit(output, { description: `${pack.name} resources` });
}
