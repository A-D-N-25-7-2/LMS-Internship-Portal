import { useEffect, useState } from "react";
import { Loader2, File, X, Download } from "lucide-react";
import api from "@/services/api";
import mammoth from "mammoth";

const FileViewer = ({ fileUrl, resourceId, file, index, onClose }) => {
  const [blobUrl, setBlobUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [docxHtml, setDocxHtml] = useState("");
  const [textVal, setTextVal] = useState("");

  const isImage = file.contentType?.startsWith("image/");
  const isPdf = file.contentType === "application/pdf";
  const isDocx = file.name?.endsWith(".docx") || file.contentType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  const isText = file.contentType?.startsWith("text/") || 
                 file.name?.endsWith(".txt") || 
                 file.name?.endsWith(".md") || 
                 file.name?.endsWith(".json") || 
                 file.name?.endsWith(".js") || 
                 file.name?.endsWith(".py") || 
                 file.name?.endsWith(".html") || 
                 file.name?.endsWith(".css");

  useEffect(() => {
    let url = null;
    const load = async () => {
      try {
        const fetchUrl = fileUrl || `/resources/file/${resourceId}/${index}`;
        const res = await api.get(
          fetchUrl,
          { responseType: "blob" }
        );
        const blob = res.data;
        url = URL.createObjectURL(blob);
        setBlobUrl(url);

        if (isDocx) {
          const reader = new FileReader();
          reader.onload = async (e) => {
            try {
              const arrayBuffer = e.target.result;
              const result = await mammoth.convertToHtml({ arrayBuffer });
              setDocxHtml(result.value);
            } catch (err) {
              console.error(err);
              setError("Failed to convert Word document to preview.");
            }
          };
          reader.readAsArrayBuffer(blob);
        } else if (isText) {
          const reader = new FileReader();
          reader.onload = (e) => {
            setTextVal(e.target.result);
          };
          reader.readAsText(blob);
        }
      } catch {
        setError("Failed to load file.");
      } finally {
        setLoading(false);
      }
    };
    load();

    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [fileUrl, resourceId, index, isDocx, isText]);


  // Disable scrolling on the main document body while full screen is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-background/98 backdrop-blur-sm flex flex-col animate-in fade-in duration-200">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b bg-card">
        <div className="flex items-center gap-3">
          <File className="text-primary size-5" />
          <h2 className="text-base font-semibold text-foreground truncate max-w-xs md:max-w-2xl">
            {file.name}
          </h2>
        </div>
        <div className="flex items-center gap-3">
          {blobUrl && (
            <a
              href={blobUrl}
              download={file.name}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 border rounded-lg hover:bg-accent text-xs text-foreground font-medium transition-colors"
            >
              <Download size={14} /> Download
            </a>
          )}
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-accent text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            aria-label="Close viewer"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 w-full h-full flex items-center justify-center p-4 md:p-6 bg-accent/20 overflow-hidden animate-in zoom-in-95 duration-200">
        {loading && (
          <div className="flex flex-col items-center gap-3">
            <Loader2 size={36} className="animate-spin text-primary" />
            <p className="text-sm text-muted-foreground font-medium">Loading file content...</p>
          </div>
        )}

        {error && (
          <div className="text-center p-6 max-w-md border rounded-xl bg-card shadow-sm space-y-4 animate-in zoom-in duration-150">
            <p className="text-sm text-destructive font-medium">{error}</p>
            {blobUrl && (
              <a
                href={blobUrl}
                download={file.name}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 border rounded-lg hover:bg-accent text-sm text-primary font-medium transition-colors"
              >
                <Download size={16} /> Try Direct Download
              </a>
            )}
          </div>
        )}

        {!loading && !error && (
          <div className="w-full h-full flex items-center justify-center overflow-auto">
            {isImage && (
              <img
                src={blobUrl}
                alt={file.name}
                className="max-w-full max-h-full object-contain rounded-lg border shadow-xl bg-card animate-in zoom-in duration-150"
              />
            )}
            {isPdf && (
              <iframe
                src={blobUrl}
                title={file.name}
                className="w-full h-full rounded-lg border shadow-xl bg-card animate-in zoom-in duration-150"
              />
            )}
            {isDocx && docxHtml && (
              <div className="w-full max-w-4xl h-full overflow-y-auto bg-card rounded-lg border shadow-xl p-8 md:p-12 animate-in zoom-in duration-150 prose prose-slate dark:prose-invert">
                <style dangerouslySetInnerHTML={{__html: `
                  .docx-preview-content table { border-collapse: collapse; width: 100%; margin: 16px 0; }
                  .docx-preview-content th, .docx-preview-content td { border: 1px solid var(--border); padding: 8px 12px; text-align: left; }
                  .docx-preview-content th { background-color: var(--accent); }
                  .docx-preview-content p { margin-bottom: 12px; line-height: 1.6; }
                  .docx-preview-content h1, .docx-preview-content h2, .docx-preview-content h3 { font-weight: bold; margin-top: 24px; margin-bottom: 12px; }
                  .docx-preview-content h1 { font-size: 1.8em; }
                  .docx-preview-content h2 { font-size: 1.4em; }
                  .docx-preview-content h3 { font-size: 1.2em; }
                `}} />
                <div className="docx-preview-content" dangerouslySetInnerHTML={{ __html: docxHtml }} />
              </div>
            )}
            {isText && textVal !== undefined && (
              <div className="w-full max-w-4xl h-full overflow-y-auto bg-card rounded-lg border shadow-xl p-6 font-mono text-xs md:text-sm whitespace-pre-wrap leading-relaxed animate-in zoom-in duration-150 text-foreground text-left">
                {textVal}
              </div>
            )}
            {!isImage && !isPdf && !isDocx && !isText && (
              <div className="text-center p-8 max-w-md border rounded-xl bg-card shadow-lg space-y-4 animate-in zoom-in duration-150">
                <div className="size-16 mx-auto rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  <File size={32} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold text-foreground">{file.name}</h3>
                  <p className="text-sm text-muted-foreground uppercase tracking-wide text-xs">
                    {file.contentType || "Unknown file type"}
                  </p>
                </div>
                <a
                  href={blobUrl}
                  download={file.name}
                  className="inline-flex w-full items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 text-sm font-semibold transition-colors shadow-sm"
                >
                  <Download size={16} /> Download File
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FileViewer;