import React, { useState, useRef, useEffect } from "react";
import { X, Crop, ZoomIn, ZoomOut } from "lucide-react";

interface ImageCropperProps {
  imageSrc: string;
  onCrop: (croppedBase64: string) => void;
  onClose: () => void;
}

export default function ImageCropper({ imageSrc, onCrop, onClose }: ImageCropperProps) {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  // Load image dimensions and draw initial canvas
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imageRef.current = img;
      draw();
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // Redraw when zoom or offset changes
  useEffect(() => {
    if (imageRef.current) {
      draw();
    }
  }, [zoom, offset]);

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas || !imageRef.current) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const img = imageRef.current;
    
    // Draw circular profile bounds
    ctx.save();
    
    // Draw image with scaling and offset centered
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    
    const scaleWidth = canvasWidth * zoom;
    const scaleHeight = (canvasWidth / (img.width / img.height)) * zoom;
    
    const posX = (canvasWidth - scaleWidth) / 2 + offset.x;
    const posY = (canvasHeight - scaleHeight) / 2 + offset.y;

    ctx.drawImage(img, posX, posY, scaleWidth, scaleHeight);
    
    // Draw cropping overlay circle
    ctx.restore();
    ctx.strokeStyle = "#FF6B00";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(canvasWidth / 2, canvasHeight / 2, canvasWidth / 2 - 4, 0, 2 * Math.PI);
    ctx.stroke();

    // Darken exterior bounds
    ctx.strokeStyle = "rgba(0,0,0,0.4)";
    ctx.lineWidth = 20;
    ctx.beginPath();
    ctx.rect(0, 0, canvasWidth, canvasHeight);
    ctx.stroke();
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStart.current = { x: e.clientX - offset.x, y: e.clientY - offset.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      dragStart.current = {
        x: e.touches[0].clientX - offset.x,
        y: e.touches[0].clientY - offset.y,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    setOffset({
      x: e.touches[0].clientX - dragStart.current.x,
      y: e.touches[0].clientY - dragStart.current.y,
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas || !imageRef.current) return;
    
    // Create secondary final output canvas corresponding to 200x200 cropped profile
    const outputCanvas = document.createElement("canvas");
    outputCanvas.width = 200;
    outputCanvas.height = 200;
    const oCtx = outputCanvas.getContext("2d");
    if (!oCtx) return;

    // Draw the circular selection box region into 200x200 output
    const img = imageRef.current;
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    
    const scaleWidth = canvasWidth * zoom;
    const scaleHeight = (canvasWidth / (img.width / img.height)) * zoom;
    
    const posX = (canvasWidth - scaleWidth) / 2 + offset.x;
    const posY = (canvasHeight - scaleHeight) / 2 + offset.y;

    // Scale canvas ratio
    const outputScaleX = 200 / canvasWidth;
    const outputScaleY = 200 / canvasHeight;

    oCtx.drawImage(
      canvas,
      0, 0, canvasWidth, canvasHeight, // Source crop
      0, 0, 200, 200 // Destination crop
    );

    const croppedBase64 = outputCanvas.toDataURL("image/jpeg", 0.9);
    onCrop(croppedBase64);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="w-full max-w-md overflow-hidden border glass-panel rounded-3xl border-white/10 bg-black shadow-[0_24px_50px_-12px_rgba(0,0,0,0.9)]">
        <div className="flex items-center justify-between p-4 border-b border-white/15 bg-white/[0.01]">
          <div className="flex items-center gap-2">
            <Crop className="w-5 h-5 text-[#FF6B00]" />
            <h3 className="font-display font-medium text-base text-white">Crop Profile Picture</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 transition rounded-full hover:bg-white/10 text-white/40 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col items-center p-6">
          <p className="mb-4 text-xs text-center text-white/40 font-mono">
            Drag to pan image. Circular area outlines the display target.
          </p>

          <div
            className="relative overflow-hidden cursor-move border rounded-full border-white/10"
            style={{ width: "260px", height: "260px" }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <canvas
              ref={canvasRef}
              width={260}
              height={260}
              className="absolute top-0 left-0"
            />
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center gap-4 mt-6 w-full px-4">
            <button
              onClick={() => setZoom(Math.max(1, zoom - 0.15))}
              className="p-2 transition rounded-full hover:bg-white/10 text-white/40 hover:text-white cursor-pointer"
            >
              <ZoomOut className="w-5 h-5" />
            </button>
            <input
              type="range"
              min="1"
              max="3"
              step="0.05"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="flex-1 accent-[#FF6B00] h-1 bg-zinc-800 rounded-lg cursor-pointer font-sans"
            />
            <button
              onClick={() => setZoom(Math.min(3, zoom + 0.15))}
              className="p-2 transition rounded-full hover:bg-white/10 text-white/40 hover:text-white cursor-pointer"
            >
              <ZoomIn className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action Panel */}
        <div className="flex items-center justify-end gap-3 p-4 bg-white/[0.02] border-t border-white/10">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold transition rounded-full hover:bg-white/5 text-white/60 hover:text-white cursor-pointer hover:underline"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 text-xs font-bold transition rounded-full bg-[#FF6B00] hover:bg-[#E05E00] text-black hover:scale-105 active:scale-95 cursor-pointer shadow-[0_0_12px_rgba(255,107,0,0.3)]"
          >
            Apply Crop
          </button>
        </div>
      </div>
    </div>
  );
}
