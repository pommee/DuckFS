"use client";

import { useEffect, useState, useCallback } from "react";
import { DataTable } from "@/app/files/table";
import { columns } from "@/app/files/columns";
import { fetchDirectory, fetchFileContent } from "@/app/home/api";
import { FileContent } from "@/app/home/FileContent";
import { File } from "@/types";
import { Separator } from "@/components/ui/separator";
import { BreadcrumbNav } from "@/app/home/Breadcrumb";

export default function FileBrowser() {
  const [currentPath, setCurrentPath] = useState("");
  const [data, setData] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [loadingContent, setLoadingContent] = useState(false);

  const loadDirectory = useCallback(async (path: string) => {
    setLoading(true);
    setError(null);
    try {
      const items = await fetchDirectory(path);
      setData(items);
    } catch {
      setError("Failed to load directory");
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDirectory(currentPath);
  }, [currentPath, loadDirectory]);

  const handleFileClick = async (file: File) => {
    if (!file.path) return;
    setSelectedFile(file);
    setLoadingContent(true);
    setFileContent(null);

    try {
      const content = await fetchFileContent(file.path);
      setFileContent(content);
    } catch (err) {
      console.error("Failed to load file content:", err);
      setFileContent(null);
    } finally {
      setLoadingContent(false);
    }
  };

  return (
    <div className="h-screen flex flex-col p-2">
      {error && <div className="text-red-600 mb-4">{error}</div>}

      <div className="flex-1 flex gap-4 min-h-0">
        <div className="w-1/2 flex flex-col min-h-0">
          <BreadcrumbNav
            currentPath={currentPath}
            onNavigate={setCurrentPath}
          />

          <div className="flex-1 overflow-auto">
            {loading ? (
              <div>Loading...</div>
            ) : (
              <DataTable
                columns={columns()}
                data={data}
                onRowClick={(item) => {
                  if (item.type === "directory") {
                    setCurrentPath(item.path);
                  } else {
                    handleFileClick(item);
                  }
                }}
              />
            )}
          </div>
        </div>

        <Separator orientation="vertical" className="self-center bg-muted/50" />

        <div className="w-1/2 flex flex-col min-h-0">
          <FileContent
            file={selectedFile}
            content={fileContent}
            loading={loadingContent}
            onClose={() => {
              setSelectedFile(null);
              setFileContent(null);
            }}
          />
        </div>
      </div>
    </div>
  );
}
