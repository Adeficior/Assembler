import {
  createLogger,
  createResolver,
  distributedAcceptor,
  writeToArchive,
  type Acceptor,
  type Logger,
} from "@adeficior/pack-resolver";
import { join, resolve } from "path";

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

  const assets = writeToArchive(
    join(paxiFolder, "resourcepacks", "generated.zip"),
  );

  const data = writeToArchive(join(paxiFolder, "datapacks", "generated.zip"));

  const content = writeToArchive(resolve(to, "contentpacks", "generated.zip"));

  const acceptors: Record<string, Acceptor> = {};

  if (include.data) acceptors["data/**"] = data;
  if (include.assets) acceptors["assets/**"] = assets;
  if (include.content) acceptors["content/**"] = content;

  const acceptor = distributedAcceptor(acceptors);
  const resolver = createResolver({ from, logger });

  await resolver.extract(acceptor);

  logger.info("Done!");
}
