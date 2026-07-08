import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getResourceById } from "@/features/resources/resourceApi";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Loader2, ArrowLeft, ExternalLink, File } from "lucide-react";
import FileViewer  from "./FileViewer";

const ResourceDetailPage = () => {
  const { resourceId } = useParams();
  const navigate = useNavigate();

  const [resource, setResource] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeFileIndex, setActiveFileIndex] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const { data } = await getResourceById(resourceId);
        setResource(data.data);
      } catch {
        setError("Failed to load resource.");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [resourceId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-muted-foreground" size={28} />
      </div>
    );
  }

  if (error || !resource) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} className="mr-1" /> Back
        </Button>
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {error || "Resource not found."}
        </div>
      </div>
    );
  }

  const hasLinks = Array.isArray(resource.links) && resource.links.length > 0;
  const hasFiles = Array.isArray(resource.files) && resource.files.length > 0;

  return (
    <div className="mx-auto space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)}
        className="-ml-2 text-muted-foreground hover:text-foreground">
        <ArrowLeft size={16} className="mr-1" /> Back to Module
      </Button>

      {/* title */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">{resource.title}</h1>
      </div>

      <Separator />

      {/* instructions */}
      {resource.description && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Instructions
          </p>
          <p className="text-foreground text-sm leading-relaxed whitespace-pre-wrap">
            {resource.description}
          </p>
        </div>
      )}

      {/* links */}
      {hasLinks && (
        <div className="space-y-3">
          {resource.links.map((link, i) => (
            <a
              key={i}
              href={link.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-lg border p-3 hover:bg-accent transition-colors group"
            >
              <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10">
                <ExternalLink size={15} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {link.label || link.link}
                </p>
                {link.label && (
                  <p className="text-xs text-muted-foreground truncate">
                    {link.link}
                  </p>
                )}
              </div>
              <ExternalLink
                size={13}
                className="text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
              />
            </a>
          ))}
        </div>
      )}

      {/* files */}
      {hasFiles && (
        <div className="space-y-4">
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Files
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {resource.files.map((file, i) => (
              <button
                key={i}
                onClick={() => setActiveFileIndex(i)}
                className="flex items-center gap-3 rounded-xl border p-4 hover:bg-accent hover:border-primary/50 hover:shadow-md transition-all cursor-pointer group bg-card text-left w-full"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                  <File size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                    {file.name}
                  </p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                    {file.contentType?.split("/")[1] || "file"}
                  </p>
                </div>
              </button>
            ))}
          </div>

          {activeFileIndex !== null && (
            <FileViewer
              resourceId={resource._id}
              file={resource.files[activeFileIndex]}
              index={activeFileIndex}
              onClose={() => setActiveFileIndex(null)}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default ResourceDetailPage;