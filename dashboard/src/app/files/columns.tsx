import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { File } from "@/types";
import { FileIcon, FolderIcon } from "@phosphor-icons/react";
import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";

export const columns = (): ColumnDef<File>[] => [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => {
      return row.original.type === "directory" ? (
        <div className="flex">
          <FolderIcon
            weight="fill"
            className="h-4 w-4 mt-0.5 mr-2 text-orange-500"
          />
          <div className="font-medium">{row.original.name}</div>
        </div>
      ) : (
        <div className="flex">
          <FileIcon className="h-4 w-4 mt-0.5 mr-2" />
          <div className="font-medium">{row.original.name}</div>
        </div>
      );
    }
  },
  {
    accessorKey: "size",
    header: "Size",
    cell: ({ row }) =>
      row.original.size != null
        ? formatBytes(row.original.size)
        : `${row.original.items ?? 0} items`
  },
  {
    accessorKey: "modified",
    header: "Modified",
    cell: ({ row }) =>
      row.original.modified?.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
      })
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const dirOrFile =
        row.original.type === "directory" ? "directory" : "file";

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost">
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(row.original.id)}
            >
              {`Delete ${dirOrFile}`}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>{`Download ${dirOrFile}`}</DropdownMenuItem>
            <DropdownMenuItem>{`Details for ${dirOrFile}`}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }
  }
];

function formatBytes(bytes: number) {
  const thresh = 1024;
  if (bytes < thresh) return bytes + " B";
  const units = thresh
    ? ["kB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"]
    : ["KiB", "MiB", "GiB", "TiB", "PiB", "EiB", "ZiB", "YiB"];
  let u = -1;
  do {
    bytes /= thresh;
    ++u;
  } while (bytes >= thresh);
  return bytes.toFixed(1) + " " + units[u];
}
