import { TOML } from "bun";
import { resolve } from "node:path";

type Pack = {
  name: string;
  author?: string;
  version?: string;
  index: {
    file: string;
    "hash-format": string;
    hash: string;
  };
  versions: {
    minecraft: string;
  };
};

// TODO use
// const { RELEASE_VERSION } = process.env;

export async function loadPack(dir: string) {
  const packFile = Bun.file(resolve(dir, "pack.toml"));

  const parsed = TOML.parse(await packFile.text()) as Pack;

  return parsed;
}
