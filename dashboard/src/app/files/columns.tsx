import { ColumnDef } from "@tanstack/react-table";

export type Directory = {
  path: string;
  files: File[];
  subdirectories: Directory[];
};

export type File = {
  name: string;
  size: number;
  readonly: boolean;
  created: Date;
  modified: Date;
  accessed: Date;
};

export const columns: ColumnDef<File>[] = [
  {
    accessorKey: "name",
    header: "Name"
  },
  {
    accessorKey: "size",
    header: "Size"
  },
  {
    accessorKey: "modified",
    header: "Modified"
  }
];
