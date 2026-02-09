"use client";

import { useEffect, useState, useCallback } from "react";
import { DataTable } from "@/app/files/table";
import { columns } from "@/app/files/columns";
import { fetchDirectory, fetchFileContent } from "@/app/home/api";
import { FileContent } from "@/app/home/FileContent";
import { File } from "@/types";
import { Separator } from "@/components/ui/separator";
import { BreadcrumbNav } from "@/app/home/Breadcrumb";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { PostRequest } from "@/util";
import { toast } from "sonner";

const PATH_STORAGE_KEY = "file-browser-current-path";
const DEPTH_STORAGE_KEY = "file-browser-depth";

const saveFileContent = async (
  path: string,
  content: string
): Promise<void> => {
  try {
    const [code, response] = await PostRequest("save", {
      path: path,
      content: content
    });

    if (code !== 200) {
      toast.error(
        "Failed to save file: " + (response.error || "Unknown error"),
        { id: "save-file-error" }
      );
      throw new Error(response.error || "Failed to save file");
    }

    toast.success("File saved successfully", { id: "save-file-success" });
  } catch (error) {
    toast.success("Save file error: " + error);
    throw error;
  }
};

export default function FileBrowser() {
  const [currentPath, setCurrentPath] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(PATH_STORAGE_KEY) || "";
    }
    return "";
  });
  const [depth, setDepth] = useState(() => {
    if (typeof window !== "undefined") {
      return parseInt(localStorage.getItem(DEPTH_STORAGE_KEY) || "1", 10);
    }
    return 1;
  });
  const [data, setData] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [loadingContent, setLoadingContent] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(PATH_STORAGE_KEY, currentPath);
    }
  }, [currentPath]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(DEPTH_STORAGE_KEY, depth.toString());
    }
  }, [depth]);

  const loadDirectory = useCallback(
    async (path: string, depthValue: number) => {
      setError(null);
      try {
        const items = await fetchDirectory(path, depthValue);
        setData(items);
      } catch {
        setError("Failed to load directory");
        setData([]);
      }
    },
    []
  );

  useEffect(() => {
    loadDirectory(currentPath, depth);
  }, [currentPath, depth, loadDirectory]);

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

  const handleSaveFile = async (content: string, filePath: string) => {
    await saveFileContent("/" + filePath, content);
    const refreshedContent = await fetchFileContent(filePath);
    setFileContent(refreshedContent);
  };

  return (
    <div className="h-screen flex flex-col p-2">
      {error && <div className="text-red-600 mb-4">{error}</div>}

      <div className="flex-1 flex gap-4 min-h-0">
        <div className="w-1/2 flex flex-col min-h-0">
          <div className="flex items-center justify-between w-full mb-2">
            <BreadcrumbNav
              currentPath={currentPath}
              onNavigate={setCurrentPath}
            />
            <div className="flex items-center gap-2">
              <Label htmlFor="depth-select" className="text-sm">
                Depth:
              </Label>
              <Select
                value={depth.toString()}
                onValueChange={(value) => setDepth(parseInt(value, 10))}
              >
                <SelectTrigger id="depth-select" className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1</SelectItem>
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="3">3</SelectItem>
                  <SelectItem value="4">4</SelectItem>
                  <SelectItem value="5">5</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DataTable
            columns={columns()}
            data={data}
            selectedRowId={selectedFile?.path}
            onRowClick={(item) => {
              if (selectedFile?.path === item.path) {
                return;
              }

              if (item.type === "directory") {
                setCurrentPath(item.path);
              } else {
                handleFileClick(item);
              }
            }}
          />
        </div>

        <Separator orientation="vertical" className="self-center bg-muted/50" />

        <div className="w-1/2 flex flex-col">
          <FileContent
            file={selectedFile}
            content={fileContent}
            setContent={setFileContent}
            loading={loadingContent}
            onClose={() => {
              setSelectedFile(null);
              setFileContent(null);
            }}
            onSave={handleSaveFile}
          />
        </div>
      </div>
    </div>
  );
}
