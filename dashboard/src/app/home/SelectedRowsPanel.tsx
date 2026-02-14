import { File } from "@/types";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatBytes } from "../files/columns";
import { FileIcon, FolderIcon } from "@phosphor-icons/react";

interface SelectedRowsPanelProps {
  selectedRows: File[];
  onRemove: (file: File) => void;
  onClearAll: () => void;
  onFileClick: (file: File) => void;
}

export function SelectedRowsPanel({
  selectedRows,
  onRemove,
  onClearAll,
  onFileClick
}: SelectedRowsPanelProps) {
  if (selectedRows.length === 0) {
    return;
  }

  return (
    <div className="border rounded-md mt-2">
      <div className="flex items-center justify-between p-1 px-2 bg-muted/50">
        <h3 className="text-sm font-medium">
          Selected ({selectedRows.length})
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="h-7 px-2 text-xs"
        >
          Clear all
        </Button>
      </div>
      <ScrollArea className="h-50">
        <div className="p-2 space-y-1">
          {selectedRows.map((file) => (
            <div
              key={file.path}
              className="flex items-center justify-between text-sm rounded hover:bg-muted/50 group"
            >
              <button
                className="flex items-center gap-1 text-left truncate"
                onClick={() => onFileClick(file)}
                title={file.name}
              >
                <span className="flex font-mono text-xs">
                  {file.type === "directory" ? (
                    <FolderIcon
                      weight="fill"
                      size={16}
                      className="text-orange-500"
                    />
                  ) : (
                    <FileIcon size={16} />
                  )}
                </span>
                {file.name}
                {file.size && (
                  <span className="text-xs text-muted-foreground ml-2">
                    ({formatBytes(file.size)})
                  </span>
                )}
              </button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => onRemove(file)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
