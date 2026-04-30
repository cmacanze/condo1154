"use client";

import { useRef, useState } from "react";
import { Button } from "./button";
import { Paperclip, X, FileText, Image } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  name: string;
  accept?: string;
  className?: string;
  currentUrl?: string | null;
  label?: string;
}

export function FileUpload({
  name,
  accept = ".pdf,.jpg,.jpeg,.png",
  className,
  currentUrl,
  label = "Anexar comprovativo",
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);

  const isPdf = (url: string) => url.toLowerCase().includes(".pdf");
  const isNewPdf = file && file.type === "application/pdf";

  return (
    <div className={cn("space-y-2", className)}>
      <input
        ref={inputRef}
        type="file"
        name={name}
        accept={accept}
        className="hidden"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
      />

      {!file && !currentUrl && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
        >
          <Paperclip className="mr-2 h-4 w-4" />
          {label}
        </Button>
      )}

      {file && (
        <div className="flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm">
          {isNewPdf ? (
            <FileText className="h-4 w-4 text-blue-600 shrink-0" />
          ) : (
            <Image className="h-4 w-4 text-blue-600 shrink-0" />
          )}
          <span className="truncate text-blue-800">{file.name}</span>
          <button
            type="button"
            onClick={() => {
              setFile(null);
              if (inputRef.current) inputRef.current.value = "";
            }}
            className="ml-auto text-blue-400 hover:text-blue-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {!file && currentUrl && (
        <div className="flex items-center gap-2">
          <a
            href={currentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-blue-600 hover:underline"
          >
            {isPdf(currentUrl) ? (
              <FileText className="h-4 w-4 shrink-0" />
            ) : (
              <Image className="h-4 w-4 shrink-0" />
            )}
            Ver comprovativo actual
          </a>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
          >
            Substituir
          </Button>
        </div>
      )}
    </div>
  );
}
