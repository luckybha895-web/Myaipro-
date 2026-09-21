import React, { useState, useRef, useCallback } from "react";
import {
  Download,
  Maximize2,
  Sliders,
  Share2,
  Copy,
  Check,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Sparkles,
  X,
  Eye,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export interface ImagePreviewProps {
  /**
   * Image URL or Base64 data URI
   */
  src: string;
  /**
   * Image alt text or description
   */
  alt?: string;
  /**
   * Title or prompt of the user-generated image
   */
  title?: string;
  /**
   * Subtitle, timestamp, or model metadata (e.g. "Gemini Flash Image • 1024x1024")
   */
  subtitle?: string;
  /**
   * Aspect ratio class (default: "aspect-square" or "aspect-auto")
   */
  aspectRatio?: "square" | "video" | "portrait" | "auto";
  /**
   * Maximum height constraint (e.g. "max-h-96", "max-h-[500px]")
   */
  maxHeightClass?: string;
  /**
   * Zoom magnification factor on hover (default: 2.2)
   */
  zoomScale?: number;
  /**
   * Optional callback when user clicks "Edit in Studio"
   */
  onEdit?: (url: string, title?: string) => void;
  /**
   * Optional callback when user clicks "Share"
   */
  onShare?: (url: string, title?: string) => void;
  /**
   * Optional extra actions or badge
   */
  badgeText?: string;
  /**
   * Custom container className
   */
  className?: string;
}

export const ImagePreview: React.FC<ImagePreviewProps> = ({
  src,
  alt = "AI generated visual artwork",
  title,
  subtitle,
  aspectRatio = "auto",
  maxHeightClass = "max-h-96",
  zoomScale = 2.2,
  onEdit,
  onShare,
  badgeText = "AI Masterpiece",
  className = "",
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [isDownloading, setIsDownloading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxZoom, setLightboxZoom] = useState(1);
  const [lightboxRotation, setLightboxRotation] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Mouse move handler for precision hover-to-zoom coordinates
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    setZoomPos({ x, y });
  }, []);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    setZoomPos({ x: 50, y: 50 });
  }, []);

  // Quick Download handler with automatic blob fetching for guaranteed local saving
  const handleQuickDownload = useCallback(
    async (e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      if (!src || isDownloading) return;

      setIsDownloading(true);
      const safeTitle = (title || "ai_generated_artwork")
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, "_")
        .slice(0, 32);
      const filename = `${safeTitle}_${Date.now()}.png`;

      try {
        if (src.startsWith("data:")) {
          // Direct base64 download
          const link = document.createElement("a");
          link.href = src;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          toast.success("Image downloaded successfully!");
        } else {
          // Fetch as blob for cross-origin downloads to avoid opening new tab
          const response = await fetch(src);
          const blob = await response.blob();
          const blobUrl = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = blobUrl;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
          toast.success("Image downloaded successfully!");
        }
      } catch {
        // Fallback to standard link click
        const link = document.createElement("a");
        link.href = src;
        link.download = filename;
        link.target = "_blank";
        link.rel = "noreferrer";
        link.click();
        toast.success("Download started!");
      } finally {
        setIsDownloading(false);
      }
    },
    [src, title, isDownloading],
  );

  // Copy Image / Link to clipboard
  const handleCopy = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      try {
        if (src.startsWith("data:")) {
          // Parse base64 and write image blob to clipboard
          const res = await fetch(src);
          const blob = await res.blob();
          await navigator.clipboard.write([
            new ClipboardItem({
              [blob.type]: blob,
            }),
          ]);
          setIsCopied(true);
          toast.success("Image copied to clipboard!");
        } else {
          await navigator.clipboard.writeText(src);
          setIsCopied(true);
          toast.success("Image link copied to clipboard!");
        }
        setTimeout(() => setIsCopied(false), 2000);
      } catch {
        // Fallback text copy
        await navigator.clipboard.writeText(src);
        setIsCopied(true);
        toast.success("Image URL copied!");
        setTimeout(() => setIsCopied(false), 2000);
      }
    },
    [src],
  );

  // Share handler
  const handleShare = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (onShare) {
        onShare(src, title);
      } else if (navigator.share) {
        navigator
          .share({
            title: title || "AI Generated Artwork",
            text: title || "Check out this AI-generated image created with Creative AI!",
            url: src.startsWith("http") ? src : window.location.href,
          })
          .catch(() => {
            /* ignore dismiss */
          });
      } else {
        handleCopy(e);
      }
    },
    [onShare, src, title, handleCopy],
  );

  const aspectRatioClasses = {
    square: "aspect-square",
    video: "aspect-video",
    portrait: "aspect-[3/4]",
    auto: "",
  }[aspectRatio];

  return (
    <>
      <div
        id="image-preview-card"
        className={`group/img relative overflow-hidden rounded-2xl border border-border/80 bg-card text-card-foreground shadow-sm transition-all hover:border-border hover:shadow-md ${className}`}
      >
        {/* Main Image Viewport with Precision Hover-to-Zoom */}
        <div
          ref={containerRef}
          onMouseMove={handleMouseMove}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onClick={() => setIsLightboxOpen(true)}
          className={`relative w-full overflow-hidden cursor-crosshair bg-muted/30 select-none ${aspectRatioClasses} ${maxHeightClass} flex items-center justify-center`}
          style={{ touchAction: "none" }}
          role="button"
          tabIndex={0}
          aria-label="Click to enlarge image, hover to zoom"
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setIsLightboxOpen(true);
            }
          }}
        >
          {/* Loading Skeleton */}
          {!imageLoaded && !imageError && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted/40 animate-pulse">
              <Loader2 className="size-6 text-muted-foreground animate-spin" />
            </div>
          )}

          {/* Error Fallback */}
          {imageError && (
            <div className="flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
              <span className="text-xs">Unable to load image artwork.</span>
            </div>
          )}

          {/* Zoomable Image Element */}
          <img
            src={src}
            alt={alt}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
            loading="lazy"
            referrerPolicy="no-referrer"
            style={{
              transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
              transform: isHovered ? `scale(${zoomScale})` : "scale(1)",
              transition: isHovered ? "transform 0.12s ease-out" : "transform 0.25s ease-in-out",
            }}
            className={`w-full h-full object-contain ${maxHeightClass} transition-opacity duration-300 ${
              imageLoaded ? "opacity-100" : "opacity-0"
            }`}
          />

          {/* Subtle Hover Zoom Magnifier Lens Reticle & Indicator */}
          {isHovered && imageLoaded && (
            <div
              className="pointer-events-none absolute z-10 top-3 right-3 flex items-center gap-1.5 rounded-full bg-black/75 px-2.5 py-1 text-[10px] font-medium text-white backdrop-blur-md shadow-lg border border-white/10 animate-in fade-in zoom-in-95 duration-150"
              aria-hidden="true"
            >
              <ZoomIn className="size-3 text-purple-400" />
              <span>{zoomScale}x Zoom</span>
            </div>
          )}

          {/* Quick Enlarge Prompt Overlay on Initial Hover */}
          {!isHovered && imageLoaded && (
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
              <span className="rounded-full bg-black/65 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-xs flex items-center gap-1.5 shadow-md">
                <Maximize2 className="size-3.5 text-white" /> Click to enlarge
              </span>
            </div>
          )}
        </div>

        {/* Bottom Metadata & Interactive Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 bg-secondary/30 border-t border-border/60">
          {/* Metadata info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground truncate">
              <Sparkles className="size-3.5 text-purple-500 shrink-0" />
              <span className="truncate">{title || badgeText}</span>
            </div>
            {subtitle && (
              <div className="text-[11px] text-muted-foreground truncate mt-0.5">{subtitle}</div>
            )}
          </div>

          {/* Action Buttons Toolbar */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Quick Edit in Studio Button */}
            {onEdit && (
              <Button
                id="preview-edit-btn"
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(src, title);
                }}
                className="h-7 px-2.5 text-xs font-semibold gap-1 text-purple-600 dark:text-purple-400 border-purple-500/30 hover:bg-purple-500/10 cursor-pointer"
                title="Edit in Image Studio"
              >
                <Sliders className="size-3" />
                <span>Edit</span>
              </Button>
            )}

            {/* Quick Share Button */}
            <Button
              id="preview-share-btn"
              size="sm"
              variant="outline"
              onClick={handleShare}
              className="h-7 px-2.5 text-xs font-semibold gap-1 text-blue-600 dark:text-blue-400 border-blue-500/30 hover:bg-blue-500/10 cursor-pointer"
              title="Share Image"
            >
              <Share2 className="size-3" />
              <span className="hidden sm:inline">Share</span>
            </Button>

            {/* Quick Copy Link / Image Button */}
            <Button
              id="preview-copy-btn"
              size="icon"
              variant="outline"
              onClick={handleCopy}
              className="size-7 text-xs cursor-pointer"
              title="Copy image or link"
            >
              {isCopied ? (
                <Check className="size-3.5 text-emerald-500" />
              ) : (
                <Copy className="size-3.5" />
              )}
            </Button>

            {/* Quick-Download Button */}
            <Button
              id="preview-quick-download-btn"
              size="sm"
              onClick={handleQuickDownload}
              disabled={isDownloading}
              className="h-7 px-3 text-xs font-semibold gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs cursor-pointer"
              title="Quick Download Image (PNG)"
            >
              {isDownloading ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <Download className="size-3" />
              )}
              <span>Download</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Fullscreen Lightbox Modal */}
      {isLightboxOpen && (
        <div
          id="image-lightbox-modal"
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex flex-col animate-in fade-in duration-200"
          onClick={() => setIsLightboxOpen(false)}
        >
          {/* Lightbox Top Header */}
          <div
            className="flex items-center justify-between p-4 text-white z-10 border-b border-white/10 bg-black/40"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 truncate pr-4">
              <span className="flex size-7 items-center justify-center rounded-lg bg-purple-500/20 text-purple-400">
                <Eye className="size-4" />
              </span>
              <div className="truncate">
                <h4 className="text-xs font-semibold truncate">
                  {title || "AI Generated Artwork"}
                </h4>
                {subtitle && <p className="text-[10px] text-white/60 truncate">{subtitle}</p>}
              </div>
            </div>

            {/* Lightbox Controls */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLightboxZoom((z) => Math.max(0.5, z - 0.25))}
                className="size-8 rounded-full text-white/80 hover:text-white hover:bg-white/10"
                title="Zoom Out"
              >
                <ZoomOut className="size-4" />
              </Button>

              <span className="text-[11px] font-mono text-white/70 min-w-10 text-center">
                {Math.round(lightboxZoom * 100)}%
              </span>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLightboxZoom((z) => Math.min(4, z + 0.25))}
                className="size-8 rounded-full text-white/80 hover:text-white hover:bg-white/10"
                title="Zoom In"
              >
                <ZoomIn className="size-4" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLightboxRotation((r) => (r + 90) % 360)}
                className="size-8 rounded-full text-white/80 hover:text-white hover:bg-white/10"
                title="Rotate 90°"
              >
                <RotateCw className="size-4" />
              </Button>

              {onEdit && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setIsLightboxOpen(false);
                    onEdit(src, title);
                  }}
                  className="h-8 px-3 text-xs gap-1.5 text-purple-300 border-purple-500/40 hover:bg-purple-500/20"
                >
                  <Sliders className="size-3.5" />
                  <span>Edit</span>
                </Button>
              )}

              <Button
                size="sm"
                onClick={handleQuickDownload}
                disabled={isDownloading}
                className="h-8 px-3 text-xs gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isDownloading ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Download className="size-3.5" />
                )}
                <span>Download</span>
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsLightboxOpen(false)}
                className="size-8 rounded-full text-white/80 hover:text-white hover:bg-white/10 ml-2"
                title="Close"
              >
                <X className="size-5" />
              </Button>
            </div>
          </div>

          {/* Lightbox Center Canvas */}
          <div
            className="flex-1 flex items-center justify-center p-4 overflow-auto cursor-grab active:cursor-grabbing select-none"
            onClick={(e) => e.stopPropagation()}
            onDoubleClick={() => setLightboxZoom((z) => (z > 1 ? 1 : 2))}
          >
            <img
              src={src}
              alt={alt}
              style={{
                transform: `scale(${lightboxZoom}) rotate(${lightboxRotation}deg)`,
                transition: "transform 0.2s ease-out",
              }}
              className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg shadow-2xl"
              draggable={false}
            />
          </div>

          {/* Lightbox Footer Helper */}
          <div className="p-2 text-center text-[11px] text-white/40 border-t border-white/10 bg-black/40">
            Double click to toggle 2x zoom • Click outside or press Esc to close
          </div>
        </div>
      )}
    </>
  );
};

export default ImagePreview;
