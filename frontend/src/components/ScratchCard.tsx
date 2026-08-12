"use client";

import React, { useRef, useEffect, useState } from "react";

interface ScratchCardProps {
  code: string;
  onReveal?: () => void;
}

export function ScratchCard({ code, onReveal }: ScratchCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const isDrawing = useRef(false);
  const hasScratched = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || isRevealed) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    // Reset composite operation to default for React Strict Mode double-renders
    ctx.globalCompositeOperation = "source-over";

    // Fill the canvas with a cute pastel gradient
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, "#a5f3fc"); // cyan-200
    gradient.addColorStop(0.5, "#e879f9"); // fuchsia-400
    gradient.addColorStop(1, "#38bdf8"); // sky-400
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw some noise or cute text
    ctx.fillStyle = "#ffffff"; 
    ctx.font = "bold 22px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("✨ SCRATCH ME! ✨", canvas.width / 2, canvas.height / 2);

    // Prepare for scratching
    ctx.globalCompositeOperation = "destination-out";
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.lineWidth = 35;

    const getMousePos = (e: any) => {
      const rect = canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      
      // Calculate scale to map CSS size to Canvas resolution
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      
      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY,
      };
    };

    const handleStart = (e: any) => {
      isDrawing.current = true;
      const { x, y } = getMousePos(e);
      ctx.beginPath();
      ctx.moveTo(x, y);
    };

    const handleMove = (e: any) => {
      if (!isDrawing.current) return;
      e.preventDefault(); // Prevent scrolling on touch
      const { x, y } = getMousePos(e);
      ctx.lineTo(x, y);
      ctx.stroke();
      hasScratched.current = true;
      
      // Throttle reveal check
      if (Math.random() < 0.1) {
        checkReveal();
      }
    };

    const handleEnd = () => {
      isDrawing.current = false;
      checkReveal();
    };

    const checkReveal = () => {
      if (isRevealed || !hasScratched.current) return;
      
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      let clearPixels = 0;
      const totalPixels = imgData.data.length / 4;
      
      // Sample every 4th pixel for speed
      for (let i = 3; i < imgData.data.length; i += 16) {
        if (imgData.data[i] === 0) clearPixels++;
      }
      
      const percentCleared = (clearPixels / (totalPixels / 4)) * 100;
      if (percentCleared > 45) {
        setIsRevealed(true);
        if (onReveal) onReveal();
      }
    };

    canvas.addEventListener("mousedown", handleStart);
    canvas.addEventListener("mousemove", handleMove, { passive: false });
    window.addEventListener("mouseup", handleEnd);
    
    canvas.addEventListener("touchstart", handleStart, { passive: false });
    canvas.addEventListener("touchmove", handleMove, { passive: false });
    window.addEventListener("touchend", handleEnd);

    return () => {
      canvas.removeEventListener("mousedown", handleStart);
      canvas.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleEnd);
      canvas.removeEventListener("touchstart", handleStart);
      canvas.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleEnd);
    };
  }, [isRevealed, onReveal]);

  return (
    <div className="relative w-full max-w-[320px] h-36 mx-auto bg-white/60 backdrop-blur-md rounded-2xl shadow-inner border border-white overflow-hidden flex items-center justify-center select-none">
      <div className="flex flex-col items-center justify-center pointer-events-none">
        <p className="text-[11px] font-bold tracking-widest uppercase text-slate-400 mb-1">Coupon Code</p>
        <p className="text-2xl font-mono font-bold tracking-[0.1em] text-[#0F1E36]">{code}</p>
      </div>
      
      <canvas
        ref={canvasRef}
        width={320}
        height={144}
        className={`absolute inset-0 w-full h-full cursor-crosshair transition-all duration-700 ease-out ${
          isRevealed ? "opacity-0 pointer-events-none scale-105" : "opacity-100"
        }`}
      />
    </div>
  );
}
