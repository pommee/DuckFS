"use client";

import { useEffect, useState, useCallback } from "react";
import { DataTable } from "@/app/files/table";
import { columns, formatBytes } from "@/app/files/columns";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { UploadIcon } from "@phosphor-icons/react";
import { ScrollArea } from "@/components/ui/scroll-area";

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
    toast.error("Save file error: " + error);
    throw error;
  }
};

const uploadFile = async (
  file: globalThis.File,
  targetPath: string
): Promise<void> => {
  try {
    const content = await file.text();
    const fullPath = targetPath ? `${targetPath}/${file.name}` : file.name;

    const [code, response] = await PostRequest("save", {
      path: "/" + fullPath,
      content: content
    });

    if (code !== 200) {
      toast.error(
        "Failed to upload file: " + (response.error || "Unknown error"),
        { id: "upload-file-error" }
      );
      throw new Error(response.error || "Failed to upload file");
    }

    toast.success("File uploaded successfully", { id: "upload-file-success" });
  } catch (error) {
    toast.error("Upload file error: " + error);
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
  const [dragActive, setDragActive] = useState(false);
  const [pendingFile, setPendingFile] = useState<globalThis.File | null>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [fontSize, setFontSize] = useState<number>(() => {
    if (typeof window === "undefined") return 12;
    return Number(localStorage.getItem("editor-fontSize")) || 12;
  });

  useEffect(() => {
    localStorage.setItem("editor-fontSize", String(fontSize));
  }, [fontSize]);

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

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setPendingFile(file);
      setUploadModalOpen(true);
    }
  }, []);

  const handleUploadConfirm = async () => {
    if (!pendingFile) return;

    try {
      await uploadFile(pendingFile, currentPath);
      await loadDirectory(currentPath, depth);
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setUploadModalOpen(false);
      setPendingFile(null);
    }
  };

  const handleUploadCancel = () => {
    setUploadModalOpen(false);
    setPendingFile(null);
  };

  return (
    <div
      className="h-screen flex flex-col p-2"
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      {error && <div className="text-red-600 mb-4">{error}</div>}

      {dragActive && (
        <div className="fixed inset-0 z-50 backdrop-blur-xs flex items-center justify-center">
          <div className="border-2 border-dashed border-primary rounded-lg p-12 bg-card">
            <div className="flex flex-col items-center gap-4">
              <UploadIcon size={48} className="text-primary" />
              <p className="text-xl">Drop file to upload</p>
            </div>
          </div>
        </div>
      )}

      <Dialog open={uploadModalOpen} onOpenChange={setUploadModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload File</DialogTitle>
            <DialogDescription>
              <div className="grid grid-cols-[auto_1fr] gap-x-2">
                <span>Filename:</span>
                <span className="text-white">{pendingFile?.name}</span>

                <span>Path:</span>
                <span className="text-white">
                  {currentPath || "the root directory"}
                </span>

                <span>Size:</span>
                <span className="text-white">
                  {formatBytes(pendingFile?.size)}
                </span>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleUploadCancel}>
              Cancel
            </Button>
            <Button onClick={handleUploadConfirm}>Upload</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

          <div className="flex-1 min-h-0 overflow-hidden">
            <ScrollArea type="always" className="h-full">
              <DataTable
                columns={columns()}
                data={data}
                selectedRowId={selectedFile?.path}
                onRowClick={(item) => {
                  if (selectedFile?.path === item.path) return;

                  if (item.type === "directory") {
                    setCurrentPath(item.path);
                  } else {
                    handleFileClick(item);
                  }
                }}
              />
            </ScrollArea>
          </div>
        </div>

        <Separator orientation="vertical" className="self-center bg-muted/50" />

        <div className="flex flex-col w-1/2">
          <FileContent
            file={selectedFile}
            content={fileContent}
            fontSize={fontSize}
            setFontSize={setFontSize}
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
