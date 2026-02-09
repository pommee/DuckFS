export type Directory = {
  path: string;
  files: File[];
  subdirectories: Directory[];
};

export interface File {
  id?: string;
  name: string;
  type?: "file" | "directory";
  size?: number;
  readonly?: boolean;
  created?: Date;
  modified?: Date;
  accessed?: Date;
  items?: number;
  path?: string;
}

export interface ApiItem {
  path: string;
  files: Array<{
    name: string;
    size: number;
    readonly: boolean;
    created: number;
    modified: number;
    accessed: number;
  }>;
  subdirectories: string[];
}
