import {
  distributedAcceptor,
  exists,
  writeToArchive,
  type Acceptor,
  type Resolver,
} from "@adeficior/pack-resolver";
import { join } from "path";

export type MergeOptions = {
  data: boolean;
  assets: boolean;
  content: boolean;
  cacheDir?: string;
};

const defaultOptions: MergeOptions = {
  assets: false,
  data: true,
  content: false,
};

export default async function mergeResources(
  from: Resolver,
  to: string,
  options: Partial<MergeOptions> = {},
) {
  const { cacheDir, ...include } = {
    ...defaultOptions,
    ...options,
  };

  const paxiFolder = join(to, "config", "paxi");

  const acceptors: Record<string, Acceptor> = {};

  const write = (prefix: string, path: string[]) => {
    const tempDir = exists(cacheDir)
      ? join(cacheDir, "merged", prefix)
      : undefined;

    acceptors[`${prefix}/**`] = writeToArchive(join(...path), { tempDir });
  };

  if (include.data) {
    write("data", [paxiFolder, "datapacks", "generated.zip"]);
  }
  if (include.assets) {
    write("assets", [paxiFolder, "resourcepacks", "generated.zip"]);
  }
  if (include.content) {
    write("content", [to, "contentpacks", "generated.zip"]);
  }

  const acceptor = distributedAcceptor(acceptors);

  await from.extract(acceptor);
}
