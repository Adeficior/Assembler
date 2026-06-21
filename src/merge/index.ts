import { createLogger, type Logger } from "@pssbletrngle/data-modifier";
import { createMergedResolver } from "@pssbletrngle/pack-resolver";
import { Mergers, createDefaultMergers } from "@pssbletrngle/resource-merger";
import { existsSync, mkdirSync } from "fs";
import { dirname, join, resolve } from "path";

const ensureDirectory = (path: string) => {
  const dir = dirname(path);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  return path;
};

export type MergeOptions = {
  logger: Logger;
  data: boolean;
  assets: boolean;
  content: boolean;
};

const defaultOptions: MergeOptions = {
  assets: true,
  data: true,
  content: false,
  logger: createLogger(),
};

export default async function mergeResources(
  from: string,
  to: string,
  options: Partial<MergeOptions> = {},
) {
  const { logger, ...include } = {
    ...defaultOptions,
    ...options,
  };

  const paxiFolder = resolve(to, "config", "paxi");

  // TODO input
  const packFormat = 48;

  const commonOptions = {
    title: "Modpack Resources",
    packFormat,
    silent: true,
    overwrite: true,
  };

  const assets = createDefaultMergers({
    output: ensureDirectory(join(paxiFolder, "resourcepacks", "generated.zip")),
    ...commonOptions,
  });

  const data = createDefaultMergers({
    output: ensureDirectory(join(paxiFolder, "datapacks", "generated.zip")),
    ...commonOptions,
  });

  const content = createDefaultMergers({
    output: ensureDirectory(resolve(to, "contentpacks", "generated.zip")),
    ...commonOptions,
  });

  async function run(merger: Mergers, include: string) {
    logger.info(`Merging ${include}...`);
    return merger.run(createMergedResolver({ from, include, silent: true }));
  }

  const promises: Promise<void>[] = [];

  if (include.data) promises.push(run(data, "data/**"));
  if (include.assets) promises.push(run(assets, "assets/**"));
  if (include.content) promises.push(run(content, "content/**"));

  await Promise.all(promises);

  logger.info("Done!");
}
