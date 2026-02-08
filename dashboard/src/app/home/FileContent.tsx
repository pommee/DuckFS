"use client";

import { CodeBlock } from "@/components/infsh/code-block";
import { File } from "@/types";
import { SpinnerIcon } from "@phosphor-icons/react";

interface FileContentProps {
  file: File | null;
  content: string | null;
  loading: boolean;
  onClose: () => void;
}

function getHighlightLanguage(filename: string): string {
  const lower = filename.toLowerCase();
  const ext = lower.split(".").pop() || "";

  if (lower === "dockerfile") return "dockerfile";
  if (lower === "makefile") return "makefile";

  switch (ext) {
    case "ts":
    case "tsx":
    case "mts":
    case "cts":
      return "typescript";
    case "js":
    case "jsx":
    case "mjs":
    case "cjs":
      return "javascript";
    case "yml":
    case "yaml":
      return "yaml";
    case "sh":
    case "bash":
    case "zsh":
      return "bash";
    case "md":
    case "markdown":
      return "markdown";
    case "h":
      return "cpp";
    default:
      return ext || "text";
  }
}

export function FileContent({ file, content, loading }: FileContentProps) {
  if (!file) {
    return (
      <CodeBlock className="max-h-[95vh] min-h-[95vh]">
        {"No file loaded"}
      </CodeBlock>
    );
  }

  const language = getHighlightLanguage(file.name);

  return (
    <div className="flex flex-col">
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <SpinnerIcon
            className="animate-spin text-muted-foreground"
            size={32}
          />
        </div>
      ) : content ? (
        <div className="flex-1 overflow-auto">
          <CodeBlock language={language} className="max-h-[95vh] min-h-[95vh]">
            {content}
          </CodeBlock>
        </div>
      ) : (
        <CodeBlock
          language={language}
          className="max-h-[95vh] min-h-[95vh] text-red-500"
        >
          {"Could not load file content"}
        </CodeBlock>
      )}
    </div>
  );
}
