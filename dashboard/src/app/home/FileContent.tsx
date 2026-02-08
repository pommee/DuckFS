"use client";

import "prismjs/themes/prism-tomorrow.css";
import { highlight, languages } from "prismjs";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-tsx";
import "prismjs/components/prism-python";
import "prismjs/components/prism-json";
import "prismjs/components/prism-css";
import { File } from "@/types";
import {
  SpinnerIcon,
  CopyIcon,
  CheckIcon,
  FloppyDiskIcon,
  XIcon
} from "@phosphor-icons/react";
import Editor from "react-simple-code-editor";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface FileContentProps {
  file: File | null;
  content: string | null;
  setContent: (content: string) => void;
  loading: boolean;
  onClose: () => void;
  onSave?: (content: string, filePath: string) => Promise<void>;
}

function getLanguage(filename: string) {
  const ext = filename.split(".").pop()?.toLowerCase();

  const languageMap: Record<string, unknown> = {
    js: languages.javascript,
    jsx: languages.jsx,
    ts: languages.typescript,
    tsx: languages.tsx,
    py: languages.python,
    json: languages.json,
    css: languages.css,
    html: languages.html,
    md: languages.markdown
  };

  return languageMap[ext || ""] || languages.javascript;
}

export function FileContent({
  file,
  content,
  setContent,
  loading,
  onClose,
  onSave
}: FileContentProps) {
  const [copied, setCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleCopy = async () => {
    if (!content) return;

    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleSave = async () => {
    if (!onSave || !file || !file.path || content === null) return;

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      await onSave(content, file.path);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save file");
      console.error("Save error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  if (!file) {
    return (
      <div className="h-full overflow-auto">
        <div className="p-4 text-center text-muted-foreground">
          No file selected
        </div>
      </div>
    );
  }

  const language = getLanguage(file.name);
  const fileExtension = file.name.split(".").pop()?.toUpperCase() || "FILE";

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between border-b py-2 px-4">
        <div className="flex items-center gap-2">
          <div className="px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded">
            {fileExtension}
          </div>
          <span className="text-sm font-medium truncate">{file.name}</span>
        </div>

        <div className="flex items-center gap-2">
          {saveSuccess && (
            <span className="text-xs text-green-600 flex items-center gap-1">
              <CheckIcon size={12} /> Saved
            </span>
          )}
          {saveError && (
            <span className="text-xs text-red-600">{saveError}</span>
          )}

          <Button
            onClick={handleSave}
            disabled={isSaving || content === null || !file.path}
            variant="default"
            size="sm"
            className="bg-primary/10 text-primary hover:bg-primary/40 hover:cursor-pointer"
          >
            {isSaving ? (
              <>
                <SpinnerIcon size={14} className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <FloppyDiskIcon size={14} />
                Save
              </>
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleCopy}
            disabled={!content || copied}
            className="h-8 w-8"
            title="Copy to clipboard"
          >
            {copied ? (
              <CheckIcon size={16} className="text-green-500" />
            ) : (
              <CopyIcon size={16} className="text-muted-foreground" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
            title="Close file"
          >
            <XIcon size={16} />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <SpinnerIcon
            className="animate-spin text-muted-foreground"
            size={32}
          />
        </div>
      ) : (
        <div className="flex-1 overflow-auto">
          <Editor
            value={content || ""}
            onValueChange={setContent}
            highlight={(code) => highlight(code, language)}
            padding={16}
            style={{
              fontFamily: '"Fira Code", "Fira Mono", monospace',
              fontSize: 12,
              lineHeight: "1.6",
              minHeight: "100%",
              backgroundColor: "transparent"
            }}
            className="focus:outline-none"
          />
        </div>
      )}
    </div>
  );
}
