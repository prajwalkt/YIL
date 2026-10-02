"use client";
import React, { useEffect, useRef, useState } from "react";
import { ArrowDown } from "lucide-react";

export default function CinematicIntro() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imagesLoaded, setImagesLoaded] = useState(0);
  const [isReady, setIsReady] = useState(false);
  
  const [frameIndex, setFrameIndex] = useState(1);
  const [scrollProgress, setScrollProgress] = useState(0);

  const totalFrames = 300;
  const imagesRef = useRef<HTMLImageElement[]>([]);

  // Preload frames
  useEffect(() => {
    let loaded = 0;
    const loadedImages: HTMLImageElement[] = [];
    
    for (let i = 1; i <= totalFrames; i++) {
      const img = new Image();
      const paddedIndex = i.toString().padStart(3, "0");
      img.src = `/intro-frames/ezgif-frame-${paddedIndex}.jpg`;
      img.onload = () => {
        loaded++;
        setImagesLoaded(loaded);
        if (loaded === totalFrames) {
          setIsReady(true);
        }
      };
      loadedImages[i] = img;
    }
    
    imagesRef.current = loadedImages;
  }, []);

  // Handle Canvas Drawing and Scroll Event
  useEffect(() => {
    if (!isReady || !canvasRef.current || !containerRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    const drawFrame = (index: number) => {
      const img = imagesRef.current[index];
      if (!img) return;
      
      const imgRatio = img.width / img.height;
      const canvasRatio = canvas.width / canvas.height;
      
      let drawWidth, drawHeight, offsetX, offsetY;
      
      // "contain" logic to keep transmitter fully visible
      if (canvasRatio > imgRatio) {
        drawHeight = canvas.height;
        drawWidth = img.height * imgRatio * (canvas.height / img.height);
        offsetX = (canvas.width - drawWidth) / 2;
        offsetY = 0;
      } else {
        drawWidth = canvas.width;
        drawHeight = img.width / imgRatio * (canvas.width / img.width);
        offsetX = 0;
        offsetY = (canvas.height - drawHeight) / 2;
      }
      
      // Dark studio black
      ctx.fillStyle = "#09090b"; 
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
    };

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      drawFrame(frameIndex);
    };
    
    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    // Scroll listener for frame calculation
    const handleScroll = () => {
      if (!containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const scrollHeight = rect.height - window.innerHeight;
      const scrollY = -rect.top;
      
      // Clamp progress between 0 and 1
      let progress = scrollY / scrollHeight;
      if (progress < 0) progress = 0;
      if (progress > 1) progress = 1;
      
      setScrollProgress(progress);
      
      let currentFrame = Math.floor(progress * (totalFrames - 1)) + 1;
      if (currentFrame > totalFrames) currentFrame = totalFrames;
      if (currentFrame < 1) currentFrame = 1;
      
      if (currentFrame !== frameIndex) {
        setFrameIndex(currentFrame);
        // Use requestAnimationFrame for smooth drawing
        requestAnimationFrame(() => drawFrame(currentFrame));
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Init
    
    return () => {
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [isReady, frameIndex]);

  // Stage logic based on scroll progress (0.0 to 1.0)
  const getStageContent = (progress: number) => {
    if (progress < 0.1) return "STAGE 1: Fully Assembled Transmitter";
    if (progress < 0.2) return "STAGE 2: Initiation of Mechanical Explosion";
    if (progress < 0.35) return "STAGE 3: Housing Separation";
    if (progress < 0.5) return "STAGE 4: Interface Module Ejection";
    if (progress < 0.65) return "STAGE 5: Internal Electronics & PCB Assembly";
    if (progress < 0.8) return "STAGE 6: Precision Sensing Components";
    if (progress < 0.9) return "STAGE 7: Terminal & Connector Isolation";
    return "STAGE 8: Final Exploded View Architecture";
  };

  return (
    <div className="w-full bg-zinc-950 text-white font-sans">
      
      {/* 1. SCROLL-DRIVEN TRANSMITTER EXPERIENCE */}
      <div ref={containerRef} className="h-[500vh] relative w-full">
        <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center">
          
          {!isReady ? (
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="text-orange-500 animate-spin w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full" />
              <div className="text-zinc-400 font-mono text-sm tracking-widest uppercase">
                Optimizing Assets... {Math.round((imagesLoaded / totalFrames) * 100)}%
              </div>
            </div>
          ) : (
            <>
              <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-contain pointer-events-none" />
              
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent opacity-90 pointer-events-none" />
              
              {/* Header Titles */}
              <div className="absolute top-12 left-12 opacity-90 mix-blend-screen pointer-events-none transition-opacity duration-500" style={{ opacity: scrollProgress < 0.05 ? 1 : 0 }}>
                 <div className="text-orange-500 font-black tracking-[0.2em] text-xs uppercase mb-1 border-l-2 border-orange-500 pl-3">Yokogawa Engineering</div>
                 <h1 className="text-white font-light text-3xl tracking-widest">TRANSMITTER <span className="font-bold">EJA110E</span></h1>
              </div>

              {/* Dynamic Stage Text */}
              <div className="absolute bottom-24 w-full flex justify-center z-10 pointer-events-none">
                <div className="text-center transition-all duration-300 transform">
                   <div className="text-orange-500 font-mono tracking-widest uppercase text-xs mb-2">System Diagnostics</div>
                   <h2 className="text-2xl font-light tracking-wide text-zinc-100 drop-shadow-2xl">{getStageContent(scrollProgress)}</h2>
                </div>
              </div>
              
              {/* Scroll Indicator */}
              <div className="absolute bottom-8 w-full flex justify-center z-10 animate-bounce pointer-events-none" style={{ opacity: scrollProgress < 0.05 ? 1 : 0 }}>
                <ArrowDown className="text-zinc-500" size={24} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
