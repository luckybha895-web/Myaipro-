import React, { useState, useRef, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Slider } from "./ui/slider";
import {
  Crop,
  Sliders,
  PenTool,
  Type,
  Square,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  Undo2,
  Download,
  Share2,
  Sparkles,
  Check,
  Upload,
  Layers,
  Palette,
} from "lucide-react";
import { toast } from "sonner";

export interface ImageCanvasEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialImage?: string | null;
  title?: string;
  onSave?: (base64Image: string) => void;
  onSendToAi?: (base64Image: string) => void;
}

type EditorTab = "filters" | "crop" | "annotate" | "transform";
type AnnotationMode = "brush" | "highlighter" | "rectangle" | "text" | null;
type CropAspectRatio = "free" | "1:1" | "16:9" | "4:3" | "9:16";

interface CropRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function ImageCanvasEditor({
  open,
  onOpenChange,
  initialImage,
  title = "Creative Canvas & Base64 Image Studio",
  onSave,
  onSendToAi,
}: ImageCanvasEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [activeImageSrc, setActiveImageSrc] = useState<string | null>(initialImage || null);
  const [activeTab, setActiveTab] = useState<EditorTab>("filters");

  // Filters State
  const [brightness, setBrightness] = useState<number>(0); // -100 to 100
  const [contrast, setContrast] = useState<number>(0); // -100 to 100
  const [saturation, setSaturation] = useState<number>(0); // -100 to 100
  const [grayscale, setGrayscale] = useState<number>(0); // 0 to 100
  const [sepia, setSepia] = useState<number>(0); // 0 to 100
  const [invert, setInvert] = useState<number>(0); // 0 to 100
  const [blur, setBlur] = useState<number>(0); // 0 to 20

  // Transform State
  const [rotation, setRotation] = useState<number>(0); // 0, 90, 180, 270
  const [flipH, setFlipH] = useState<boolean>(false);
  const [flipV, setFlipV] = useState<boolean>(false);

  // Crop State
  const [cropAspectRatio, setCropAspectRatio] = useState<CropAspectRatio>("free");
  const [cropRegion, setCropRegion] = useState<CropRegion | null>(null);
  const [isDraggingCrop, setIsDraggingCrop] = useState<boolean>(false);
  const [cropDragStart, setCropDragStart] = useState<{ x: number; y: number } | null>(null);

  // Annotations State
  const [annotationMode, setAnnotationMode] = useState<AnnotationMode>("brush");
  const [strokeColor, setStrokeColor] = useState<string>("#38bdf8");
  const [strokeWidth, setStrokeWidth] = useState<number>(4);
  const [textInput, setTextInput] = useState<string>("");
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [lastPoint, setLastPoint] = useState<{ x: number; y: number } | null>(null);

  // History stack for Undo
  const [history, setHistory] = useState<ImageData[]>([]);
  const [imgLoaded, setImgLoaded] = useState<boolean>(false);
  const originalImageObj = useRef<HTMLImageElement | null>(null);

  // Synchronize initial image
  useEffect(() => {
    if (initialImage) {
      setActiveImageSrc(initialImage);
    }
  }, [initialImage]);

  // Helper to re-apply transformations
  const applyAllTransformations = useCallback(
    (ctx: CanvasRenderingContext2D, img: HTMLImageElement, width: number, height: number) => {
      ctx.clearRect(0, 0, width, height);
      ctx.save();

      // Filters string
      const filterParts: string[] = [];
      if (brightness !== 0) filterParts.push(`brightness(${100 + brightness}%)`);
      if (contrast !== 0) filterParts.push(`contrast(${100 + contrast}%)`);
      if (saturation !== 0) filterParts.push(`saturate(${100 + saturation}%)`);
      if (grayscale > 0) filterParts.push(`grayscale(${grayscale}%)`);
      if (sepia > 0) filterParts.push(`sepia(${sepia}%)`);
      if (invert > 0) filterParts.push(`invert(${invert}%)`);
      if (blur > 0) filterParts.push(`blur(${blur}px)`);

      ctx.filter = filterParts.length > 0 ? filterParts.join(" ") : "none";

      // Translation for rotation and flipping
      ctx.translate(width / 2, height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);

      ctx.drawImage(img, -width / 2, -height / 2, width, height);
      ctx.restore();
    },
    [brightness, contrast, saturation, grayscale, sepia, invert, blur, rotation, flipH, flipV],
  );

  // Load and render base image into canvas
  const renderBaseCanvas = useCallback(() => {
    if (!activeImageSrc) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = activeImageSrc;

    img.onload = () => {
      originalImageObj.current = img;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;

      canvas.width = img.naturalWidth || 800;
      canvas.height = img.naturalHeight || 600;

      applyAllTransformations(ctx, img, canvas.width, canvas.height);
      setImgLoaded(true);

      // Initialize crop region to full image
      setCropRegion({
        x: 0,
        y: 0,
        width: canvas.width,
        height: canvas.height,
      });

      // Save initial state to history
      const initialData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      setHistory([initialData]);
    };
  }, [activeImageSrc, applyAllTransformations]);

  useEffect(() => {
    if (open && activeImageSrc) {
      renderBaseCanvas();
    }
  }, [open, activeImageSrc, renderBaseCanvas]);

  // Redraw when filters or rotation change
  const redrawFiltersAndTransform = useCallback(() => {
    if (!originalImageObj.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    applyAllTransformations(ctx, originalImageObj.current, canvas.width, canvas.height);
  }, [applyAllTransformations]);

  useEffect(() => {
    if (imgLoaded) {
      redrawFiltersAndTransform();
    }
  }, [redrawFiltersAndTransform, imgLoaded]);

  // Save state to undo history
  function saveState() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory((prev) => [...prev.slice(-10), data]);
  }

  function handleUndo() {
    if (history.length <= 1) {
      toast.info("No further actions to undo.");
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    const newHistory = [...history];
    newHistory.pop(); // Remove current
    const previousState = newHistory[newHistory.length - 1];

    if (previousState) {
      canvas.width = previousState.width;
      canvas.height = previousState.height;
      ctx.putImageData(previousState, 0, 0);
      setHistory(newHistory);
      toast.success("Undone previous annotation/edit.");
    }
  }

  // Preset Filters
  function applyPreset(preset: "normal" | "vivid" | "noir" | "vintage" | "cyber" | "soft") {
    switch (preset) {
      case "normal":
        setBrightness(0);
        setContrast(0);
        setSaturation(0);
        setGrayscale(0);
        setSepia(0);
        setInvert(0);
        setBlur(0);
        break;
      case "vivid":
        setBrightness(10);
        setContrast(30);
        setSaturation(40);
        setGrayscale(0);
        setSepia(0);
        setInvert(0);
        setBlur(0);
        break;
      case "noir":
        setBrightness(5);
        setContrast(45);
        setSaturation(-100);
        setGrayscale(100);
        setSepia(0);
        setInvert(0);
        setBlur(0);
        break;
      case "vintage":
        setBrightness(-5);
        setContrast(15);
        setSaturation(-20);
        setGrayscale(0);
        setSepia(50);
        setInvert(0);
        setBlur(0);
        break;
      case "cyber":
        setBrightness(15);
        setContrast(50);
        setSaturation(80);
        setInvert(10);
        setSepia(0);
        setBlur(0);
        break;
      case "soft":
        setBrightness(15);
        setContrast(-10);
        setSaturation(10);
        setGrayscale(0);
        setSepia(15);
        setBlur(1);
        break;
    }
    toast.success(`Applied ${preset.toUpperCase()} filter preset.`);
  }

  // Get Canvas coordinate from mouse/touch event
  function getCanvasCoordinates(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }

  // Drawing Handlers
  function handleMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    const coords = getCanvasCoordinates(e);

    if (activeTab === "crop") {
      setIsDraggingCrop(true);
      setCropDragStart(coords);
      setCropRegion({
        x: coords.x,
        y: coords.y,
        width: 10,
        height: 10,
      });
      return;
    }

    if (activeTab === "annotate" && annotationMode) {
      saveState();
      setIsDrawing(true);
      setLastPoint(coords);

      if (annotationMode === "text") {
        if (!textInput.trim()) {
          toast.info("Type your annotation text below first, then click on the canvas.");
          return;
        }
        drawTextOnCanvas(coords.x, coords.y, textInput.trim());
      }
    }
  }

  function handleMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    const coords = getCanvasCoordinates(e);

    if (activeTab === "crop" && isDraggingCrop && cropDragStart) {
      let width = coords.x - cropDragStart.x;
      let height = coords.y - cropDragStart.y;

      if (cropAspectRatio === "1:1") {
        const size = Math.max(Math.abs(width), Math.abs(height));
        width = width >= 0 ? size : -size;
        height = height >= 0 ? size : -size;
      } else if (cropAspectRatio === "16:9") {
        height = (width * 9) / 16;
      } else if (cropAspectRatio === "4:3") {
        height = (width * 3) / 4;
      } else if (cropAspectRatio === "9:16") {
        height = (width * 16) / 9;
      }

      setCropRegion({
        x: width < 0 ? cropDragStart.x + width : cropDragStart.x,
        y: height < 0 ? cropDragStart.y + height : cropDragStart.y,
        width: Math.abs(width),
        height: Math.abs(height),
      });
      return;
    }

    if (activeTab === "annotate" && isDrawing && lastPoint) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      if (annotationMode === "brush" || annotationMode === "highlighter") {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(lastPoint.x, lastPoint.y);
        ctx.lineTo(coords.x, coords.y);
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = strokeWidth * (annotationMode === "highlighter" ? 4 : 1);
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.globalAlpha = annotationMode === "highlighter" ? 0.35 : 1.0;
        ctx.stroke();
        ctx.restore();
        setLastPoint(coords);
      }
    }
  }

  function handleMouseUp(e: React.MouseEvent<HTMLCanvasElement>) {
    if (activeTab === "crop" && isDraggingCrop) {
      setIsDraggingCrop(false);
      setCropDragStart(null);
      return;
    }

    if (activeTab === "annotate" && isDrawing) {
      const coords = getCanvasCoordinates(e);
      if (annotationMode === "rectangle" && lastPoint) {
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.save();
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = strokeWidth;
            ctx.strokeRect(
              Math.min(lastPoint.x, coords.x),
              Math.min(lastPoint.y, coords.y),
              Math.abs(coords.x - lastPoint.x),
              Math.abs(coords.y - lastPoint.y),
            );
            ctx.restore();
          }
        }
      }
      setIsDrawing(false);
      setLastPoint(null);
    }
  }

  function drawTextOnCanvas(x: number, y: number, text: string) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.save();
    const fontSize = Math.max(16, strokeWidth * 6);
    ctx.font = `bold ${fontSize}px sans-serif`;

    // Measure text for background highlight pill
    const metrics = ctx.measureText(text);
    const padding = 6;
    ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
    ctx.beginPath();
    ctx.roundRect(
      x - padding,
      y - fontSize - padding + 2,
      metrics.width + padding * 2,
      fontSize + padding * 2,
      6,
    );
    ctx.fill();

    // Draw text
    ctx.fillStyle = strokeColor;
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  // Apply Crop
  function handleApplyCrop() {
    const canvas = canvasRef.current;
    if (!canvas || !cropRegion) return;
    if (cropRegion.width < 10 || cropRegion.height < 10) {
      toast.info("Please drag a larger region on the canvas to crop.");
      return;
    }

    saveState();
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const croppedData = ctx.getImageData(
      cropRegion.x,
      cropRegion.y,
      cropRegion.width,
      cropRegion.height,
    );

    canvas.width = cropRegion.width;
    canvas.height = cropRegion.height;
    ctx.putImageData(croppedData, 0, 0);

    // Update active base image with cropped snapshot
    const newBase64 = canvas.toDataURL("image/png");
    setActiveImageSrc(newBase64);

    setCropRegion(null);
    setActiveTab("filters");
    toast.success(`Cropped canvas to ${Math.round(canvas.width)}x${Math.round(canvas.height)}px.`);
  }

  // Export base64
  function getExportBase64(): string {
    const canvas = canvasRef.current;
    if (!canvas) return "";
    return canvas.toDataURL("image/png");
  }

  function handleSave() {
    const base64 = getExportBase64();
    if (!base64) return;
    onSave?.(base64);
    toast.success("Edited image saved successfully!");
    onOpenChange(false);
  }

  function handleDownload() {
    const base64 = getExportBase64();
    if (!base64) return;
    const a = document.createElement("a");
    a.href = base64;
    a.download = `creative-edited-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success("Downloaded high-res PNG image!");
  }

  function handleSendToChat() {
    const base64 = getExportBase64();
    if (!base64) return;
    onSendToAi?.(base64);
    toast.success("Attached edited image to AI session!");
    onOpenChange(false);
  }

  function handleUploadImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setActiveImageSrc(result);
      toast.success("Imported new image into canvas editor.");
    };
    reader.readAsDataURL(file);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden bg-background border-border text-foreground shadow-2xl">
        {/* Header */}
        <DialogHeader className="p-4 border-b border-border bg-card/60 flex flex-row items-center justify-between">
          <div className="space-y-0.5">
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-foreground">
              <Sparkles className="size-4 text-sky-500" />
              <span>{title}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Canvas-based crops, real-time filters, freehand brush, and base64 export.
            </DialogDescription>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleUploadImage}
              accept="image/*"
              className="hidden"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs h-8 gap-1.5 cursor-pointer"
            >
              <Upload className="size-3.5" />
              <span>Replace Image</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleUndo}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              title="Undo last stroke"
            >
              <Undo2 className="size-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Studio Body */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-[460px]">
          {/* Main Canvas Viewport */}
          <div
            ref={containerRef}
            className="flex-1 relative bg-slate-950/80 flex items-center justify-center p-4 overflow-auto min-h-[300px]"
          >
            {activeImageSrc ? (
              <div className="relative inline-block max-w-full max-h-full shadow-2xl rounded-lg overflow-hidden border border-white/10">
                <canvas
                  ref={canvasRef}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  className={`max-w-full max-h-[60vh] object-contain block select-none ${
                    activeTab === "crop"
                      ? "cursor-crosshair"
                      : activeTab === "annotate"
                        ? "cursor-pencil"
                        : "cursor-default"
                  }`}
                />

                {/* Crop Region Selection Overlay */}
                {activeTab === "crop" && cropRegion && cropRegion.width > 0 && (
                  <div
                    className="absolute border-2 border-dashed border-sky-400 bg-sky-500/20 pointer-events-none"
                    style={{
                      left: `${(cropRegion.x / (canvasRef.current?.width || 1)) * 100}%`,
                      top: `${(cropRegion.y / (canvasRef.current?.height || 1)) * 100}%`,
                      width: `${(cropRegion.width / (canvasRef.current?.width || 1)) * 100}%`,
                      height: `${(cropRegion.height / (canvasRef.current?.height || 1)) * 100}%`,
                    }}
                  />
                )}
              </div>
            ) : (
              <div className="text-center p-8 text-muted-foreground">
                <Layers className="size-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm font-medium">No image loaded</p>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  size="sm"
                  className="mt-3 text-xs"
                >
                  Upload Image
                </Button>
              </div>
            )}
          </div>

          {/* Right Toolbar Panel */}
          <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-border bg-card/40 flex flex-col justify-between overflow-y-auto max-h-[45vh] md:max-h-none">
            {/* Tab Selectors */}
            <div className="p-3 border-b border-border bg-card/60">
              <div className="grid grid-cols-4 gap-1 bg-secondary/70 p-1 rounded-xl text-xs">
                <button
                  onClick={() => setActiveTab("filters")}
                  className={`py-1.5 px-2 rounded-lg font-semibold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                    activeTab === "filters"
                      ? "bg-card text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Sliders className="size-3.5" />
                  <span className="text-[10px]">Filters</span>
                </button>
                <button
                  onClick={() => setActiveTab("crop")}
                  className={`py-1.5 px-2 rounded-lg font-semibold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                    activeTab === "crop"
                      ? "bg-card text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Crop className="size-3.5" />
                  <span className="text-[10px]">Crop</span>
                </button>
                <button
                  onClick={() => setActiveTab("annotate")}
                  className={`py-1.5 px-2 rounded-lg font-semibold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                    activeTab === "annotate"
                      ? "bg-card text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <PenTool className="size-3.5" />
                  <span className="text-[10px]">Draw</span>
                </button>
                <button
                  onClick={() => setActiveTab("transform")}
                  className={`py-1.5 px-2 rounded-lg font-semibold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                    activeTab === "transform"
                      ? "bg-card text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <RotateCw className="size-3.5" />
                  <span className="text-[10px]">Rotate</span>
                </button>
              </div>
            </div>

            {/* Tab Controls Content */}
            <div className="p-4 space-y-4 flex-1">
              {/* TAB 1: FILTERS */}
              {activeTab === "filters" && (
                <div className="space-y-4">
                  {/* Preset Pills */}
                  <div>
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                      Filter Presets
                    </span>
                    <div className="grid grid-cols-3 gap-1.5 text-xs">
                      {[
                        { id: "normal", label: "Original" },
                        { id: "vivid", label: "Vivid HDR" },
                        { id: "noir", label: "Noir B&W" },
                        { id: "vintage", label: "Vintage" },
                        { id: "cyber", label: "Cyber" },
                        { id: "soft", label: "Soft Glow" },
                      ].map((p) => (
                        <Button
                          key={p.id}
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            applyPreset(
                              p.id as "normal" | "vivid" | "noir" | "vintage" | "cyber" | "soft",
                            )
                          }
                          className="text-[11px] h-7 px-2"
                        >
                          {p.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Sliders */}
                  <div className="space-y-3 pt-2 border-t border-border">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span>Brightness</span>
                        <span className="font-mono text-[11px] text-muted-foreground">
                          {brightness > 0 ? `+${brightness}` : brightness}
                        </span>
                      </div>
                      <Slider
                        value={[brightness]}
                        min={-100}
                        max={100}
                        step={1}
                        onValueChange={([val]) => val !== undefined && setBrightness(val)}
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span>Contrast</span>
                        <span className="font-mono text-[11px] text-muted-foreground">
                          {contrast > 0 ? `+${contrast}` : contrast}
                        </span>
                      </div>
                      <Slider
                        value={[contrast]}
                        min={-100}
                        max={100}
                        step={1}
                        onValueChange={([val]) => val !== undefined && setContrast(val)}
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span>Saturation</span>
                        <span className="font-mono text-[11px] text-muted-foreground">
                          {saturation > 0 ? `+${saturation}` : saturation}
                        </span>
                      </div>
                      <Slider
                        value={[saturation]}
                        min={-100}
                        max={100}
                        step={1}
                        onValueChange={([val]) => val !== undefined && setSaturation(val)}
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span>Sepia Warmth</span>
                        <span className="font-mono text-[11px] text-muted-foreground">
                          {sepia}%
                        </span>
                      </div>
                      <Slider
                        value={[sepia]}
                        min={0}
                        max={100}
                        step={1}
                        onValueChange={([val]) => val !== undefined && setSepia(val)}
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span>Blur Defocus</span>
                        <span className="font-mono text-[11px] text-muted-foreground">
                          {blur}px
                        </span>
                      </div>
                      <Slider
                        value={[blur]}
                        min={0}
                        max={15}
                        step={1}
                        onValueChange={([val]) => val !== undefined && setBlur(val)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: CROP */}
              {activeTab === "crop" && (
                <div className="space-y-4">
                  <p className="text-xs text-muted-foreground">
                    Select an aspect ratio preset, then click &amp; drag across the canvas to frame
                    your crop.
                  </p>

                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: "free", label: "Freeform" },
                      { id: "1:1", label: "1:1 Square" },
                      { id: "16:9", label: "16:9 Cinema" },
                      { id: "4:3", label: "4:3 Standard" },
                      { id: "9:16", label: "9:16 Story" },
                    ].map((ar) => (
                      <Button
                        key={ar.id}
                        variant={cropAspectRatio === ar.id ? "default" : "outline"}
                        size="sm"
                        onClick={() =>
                          setCropAspectRatio(ar.id as "free" | "1:1" | "16:9" | "4:3" | "9:16")
                        }
                        className="text-xs h-8"
                      >
                        {ar.label}
                      </Button>
                    ))}
                  </div>

                  {cropRegion && cropRegion.width > 20 && (
                    <div className="pt-3 border-t border-border space-y-2">
                      <div className="text-xs text-muted-foreground font-mono flex items-center justify-between">
                        <span>Selected Area:</span>
                        <span>
                          {Math.round(cropRegion.width)} × {Math.round(cropRegion.height)} px
                        </span>
                      </div>
                      <Button
                        onClick={handleApplyCrop}
                        className="w-full bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold h-8 gap-1.5"
                      >
                        <Check className="size-3.5" />
                        <span>Apply Crop Region</span>
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: ANNOTATE */}
              {activeTab === "annotate" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-1.5">
                    <Button
                      variant={annotationMode === "brush" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setAnnotationMode("brush")}
                      className="text-xs h-8 gap-1"
                    >
                      <PenTool className="size-3" /> Pen
                    </Button>
                    <Button
                      variant={annotationMode === "highlighter" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setAnnotationMode("highlighter")}
                      className="text-xs h-8 gap-1"
                    >
                      <Palette className="size-3" /> Highl.
                    </Button>
                    <Button
                      variant={annotationMode === "rectangle" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setAnnotationMode("rectangle")}
                      className="text-xs h-8 gap-1"
                    >
                      <Square className="size-3" /> Box
                    </Button>
                  </div>

                  {/* Color Palette */}
                  <div>
                    <span className="text-[11px] font-bold text-muted-foreground uppercase block mb-1.5">
                      Stroke Color
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {[
                        "#38bdf8",
                        "#ef4444",
                        "#10b981",
                        "#f59e0b",
                        "#a855f7",
                        "#ec4899",
                        "#ffffff",
                        "#000000",
                      ].map((c) => (
                        <button
                          key={c}
                          onClick={() => setStrokeColor(c)}
                          className={`size-6 rounded-full border border-white/20 transition-all cursor-pointer ${
                            strokeColor === c
                              ? "scale-125 ring-2 ring-sky-400 ring-offset-2 ring-offset-card"
                              : ""
                          }`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Stroke Width */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span>Brush Size</span>
                      <span className="font-mono text-[11px] text-muted-foreground">
                        {strokeWidth}px
                      </span>
                    </div>
                    <Slider
                      value={[strokeWidth]}
                      min={1}
                      max={24}
                      step={1}
                      onValueChange={([val]) => val !== undefined && setStrokeWidth(val)}
                    />
                  </div>

                  {/* Text Annotation Tool */}
                  <div className="pt-2 border-t border-border space-y-2">
                    <span className="text-[11px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                      <Type className="size-3" /> Text Overlay
                    </span>
                    <input
                      type="text"
                      value={textInput}
                      onChange={(e) => {
                        setTextInput(e.target.value);
                        setAnnotationMode("text");
                      }}
                      placeholder="Type text, then click canvas..."
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-border bg-background font-medium"
                    />
                  </div>
                </div>
              )}

              {/* TAB 4: TRANSFORM */}
              {activeTab === "transform" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setRotation((prev) => (prev + 90) % 360)}
                      className="text-xs h-9 justify-start gap-2"
                    >
                      <RotateCw className="size-4" />
                      <span>Rotate 90° Clockwise</span>
                    </Button>
                    <Button
                      variant={flipH ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFlipH((prev) => !prev)}
                      className="text-xs h-9 justify-start gap-2"
                    >
                      <FlipHorizontal className="size-4" />
                      <span>Flip Horizontally</span>
                    </Button>
                    <Button
                      variant={flipV ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFlipV((prev) => !prev)}
                      className="text-xs h-9 justify-start gap-2"
                    >
                      <FlipVertical className="size-4" />
                      <span>Flip Vertically</span>
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="p-3 border-t border-border bg-card/70 space-y-2">
              <div className="flex gap-2">
                <Button
                  onClick={handleDownload}
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs h-8 gap-1"
                >
                  <Download className="size-3.5" />
                  <span>Download</span>
                </Button>
                {onSendToAi && (
                  <Button
                    onClick={handleSendToChat}
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs h-8 gap-1 text-sky-500 border-sky-500/30 hover:bg-sky-500/10"
                  >
                    <Share2 className="size-3.5" />
                    <span>Send to AI</span>
                  </Button>
                )}
              </div>

              <Button
                onClick={handleSave}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold h-9 gap-1.5 shadow-sm"
              >
                <Check className="size-4" />
                <span>Save Edited Base64 Image</span>
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
