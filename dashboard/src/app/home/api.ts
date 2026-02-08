import { ApiItem, File } from "@/types";
import { GetRequest } from "@/util";

const FS_ROOT = "/";

function buildApiPath(currentPath: string): string {
  const clean = currentPath.replace(/^\/+|\/+$/g, "");
  const root = FS_ROOT.replace(/^\/+|\/+$/g, "");

  const full = root ? `${root}${clean ? "/" + clean : ""}` : clean;
  return `fs?path=${full}&depth=1`;
}

export async function fetchDirectory(path: string): Promise<File[]> {
  const [code, response] = await GetRequest(buildApiPath(path));

  if (code !== 200 || !response?.data) return [];

  const apiItems = response.data.Directories as ApiItem[];

  const normalizedTarget = path
    ? `${FS_ROOT}/${path}`.replace(/^\/+/, "")
    : FS_ROOT.replace(/^\/+/, "");

  const currentItem = apiItems.find((item) => {
    const normalized = item.path.replace(/^\/+/, "");
    return normalized === normalizedTarget;
  });

  if (!currentItem) return [];

  const rows: File[] = [];

  for (const subName of currentItem.subdirectories) {
    const subPath = path ? `${path}/${subName}` : subName;

    const subEntry = apiItems.find((item) => item.path.endsWith(`/${subName}`));

    const fileCount = subEntry?.files.length ?? 0;
    const dirCount = subEntry?.subdirectories.length ?? 0;

    rows.push({
      name: subName,
      type: "directory",
      items: fileCount + dirCount,
      path: subPath
    });
  }

  for (const file of currentItem.files) {
    rows.push({
      name: file.name,
      type: "file",
      size: file.size,
      readonly: file.readonly,
      created: new Date(file.created * 1000),
      modified: new Date(file.modified * 1000),
      accessed: new Date(file.accessed * 1000),
      path: path ? `${path}/${file.name}` : file.name
    });
  }

  return rows;
}

export async function fetchFileContent(path: string): Promise<string | null> {
  const fullPath = path ? `${FS_ROOT}/${path}` : FS_ROOT;
  const [code, response] = await GetRequest(`fs?path=${fullPath}`);

  if (code !== 200 || !response?.data) return null;

  return response.data.FileContents ?? null;
}
