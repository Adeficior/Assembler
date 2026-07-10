import {
  distributedAcceptor,
  notNull,
  simpleAcceptor,
  writeToArchive,
  writeToFolder,
  type Acceptor,
  type Resolver,
} from "@adeficior/pack-resolver";
import { join } from "path";
import type { Options } from "../args";

export type MergeOptions = {
  cacheDir?: string;
};

export default async function mergeResources(
  from: Resolver,
  { dirs }: Pick<Options, "dirs">,
) {
  const paxiFolder = join(dirs.assembledPack, "config", "paxi");

  const acceptors: Record<string, Acceptor> = {};

  const write = async (prefix: string, path: string[]) => {
    const tempDir = notNull(dirs.cache)
      ? join(dirs.cache, "merged", prefix)
      : undefined;

    acceptors[`${prefix}/**`] = await writeToArchive(join(...path), {
      tempDir,
    });
  };

  await write("data", [paxiFolder, "datapacks", "generated.zip"]);
  await write("assets", [paxiFolder, "resourcepacks", "generated.zip"]);
  await write("content", [dirs.assembledPack, "contentpacks", "generated.zip"]);

  // TODO write to archive check for actual files
  const packs = Object.values(acceptors);
  const fallback = simpleAcceptor(async (...args) => {
    await Promise.all(packs.map((it) => it.accept(...args)));
  });

  // TODO extract to config
  acceptors["graph/**"] = writeToFolder("web/src/graph");

  const acceptor = distributedAcceptor(acceptors, fallback);

  await from.extract(acceptor);
}
