import type { Pack } from "../pack";

function extractLoader({ versions }: Pack) {
  if (versions.neoforge) return "neoforge";
  if (versions.fabric) return "fabric";
  if (versions.forge) return "forge";
}

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

  // TODO changelog
  body.set(
    "data",
    JSON.stringify({
      name: pack.version,
      version_number: pack.version,
      game_versions: [pack.versions.minecraft],
      loaders: [extractLoader(pack)],
      project_id: projectId,
      environment: "client_and_server",
      file_parts: ["pack"],
    }),
  );

  body.set("pack", file);

  const response = await fetch(`https://api.modrinth.com/v2/version`, {
    method: "POST",
    body,
    headers: {
      "User-Agent": "@adeficior/assembler",
      Authorization: token,
    },
  });

  if (!response.ok) {
    throw new Error(`modrinth responded with ${response.status}`);
  }
}
