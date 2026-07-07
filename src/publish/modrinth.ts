import { basename } from "node:path";
import type { Pack } from "../pack";

function extractLoader({ versions }: Pack) {
  if (versions.neoforge) return "neoforge";
  if (versions.fabric) return "fabric";
  if (versions.forge) return "forge";
}

type ModrinthError = {
  description: string;
  error: string;
};

type VersionCreated = {
  id: string;
};

export async function uploadToModrinth(
  pack: Pack,
  exportedFile: string,
  projectId: string,
  token: string,
) {
  const file = Bun.file(exportedFile);
  if (!(await file.exists()))
    throw new Error(`exported file could not be found at '${exportedFile}'`);

  const body = new FormData();

  const fileName = basename(exportedFile);

  // TODO changelog
  body.set(
    "data",
    JSON.stringify({
      name: pack.version,
      version_number: pack.version,
      dependencies: [],
      game_versions: [pack.versions.minecraft],
      version_type: "release",
      loaders: [extractLoader(pack)],
      featured: true,
      status: "listed",
      project_id: projectId,
      file_parts: fileName,
      primary_file: fileName,
      environment: "client_and_server",
      file_types: {
        [fileName]: "application/x-modrinth-modpack+zip",
      },
    }),
  );

  body.set(fileName, file);

  const response = await fetch(`https://api.modrinth.com/v2/version`, {
    method: "POST",
    body,
    headers: {
      "User-Agent": "@adeficior/assembler",
      Authorization: token,
    },
  });

  if (!response.ok) {
    if (response.headers.get("Content-Type")?.startsWith("application/json")) {
      const { description, error } = (await response.json()) as ModrinthError;
      throw new Error(`modrinth responded with ${error}: ${description}`);
    } else {
      throw new Error(`modrinth responded with ${response.status}`);
    }
  }

  const { id } = (await response.json()) as VersionCreated;
  return id;
}
