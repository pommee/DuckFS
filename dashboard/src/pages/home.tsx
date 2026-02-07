"use client";

import { columns, File } from "@/app/files/columns";
import { DataTable } from "@/app/files/table";
import { GetRequest } from "@/util";
import { useEffect, useState } from "react";

async function getData(): Promise<File[]> {
  const [code, response] = await GetRequest("fs?path=home/hugo/dev/duckfs");

  if (code !== 200) {
    return [];
  }

  let files = [];
  let subdirectories = [];
  for (const item of response.data) {
    for (const file of item.files) {
      files.push({
        name: file.name,
        size: file.size,
        readonly: file.readonly,
        created: new Date(file.created),
        modified: new Date(file.modified),
        accessed: new Date(file.accessed)
      });
    }
    for (const subdir of item.subdirectories) {
      subdirectories.push({
        subdir
      });
    }
  }

  return files.map((file, _) => ({
    ...file,
    icon: subdirectories.some((subdir) => subdir.subdir === file.name)
      ? "folder"
      : "file"
  }));
}

export default function Home() {
  const [data, setData] = useState<File[]>([]);

  useEffect(() => {
    getData().then(setData);
  }, []);

  return (
    <div className="container mx-auto py-10">
      <DataTable columns={columns} data={data} />
    </div>
  );
}
