import { useRef, useEffect, useState } from "react";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-webgl";
import * as cocoSsd from "@tensorflow-models/coco-ssd";

export default function CameraScanner({ onUpdate, enabled = true }) {
  const videoRef = useRef();
  const canvasRef = useRef();
  const containerRef = useRef();
  const streamRef = useRef(null);
  const rafIdRef = useRef(null);
  const [model, setModel] = useState(null);
  const [detections, setDetections] = useState([]);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // load model only once
  useEffect(() => {
    cocoSsd.load().then(setModel);
    
    // Cleanup function
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, []);

  // Set fixed dimensions once on mount instead of resizing continuously
  useEffect(() => {
    function setFixedDimensions() {
      if (containerRef.current) {
        // Use parent container's fixed dimensions from page.jsx (400px height)
        const container = containerRef.current.getBoundingClientRect();
        setDimensions({
          width: container.width,
          height: 400 // Match the fixed height from parent container
        });
      }
    }

    // Call once only, don't listen for resize events
    setFixedDimensions();
  }, []);

  // handle camera stream based on enabled state
  useEffect(() => {
    async function startCamera() {
      // Don't restart if we already have a stream
      if (streamRef.current && videoRef.current && videoRef.current.srcObject) {
        return;
      }
      
      try {
        const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
        streamRef.current = videoStream;
        
        if (videoRef.current) {
          videoRef.current.srcObject = videoStream;
          await new Promise((r) => (videoRef.current.onloadedmetadata = r));
          videoRef.current.play();
          
          // Set dimensions once video is loaded
          if (containerRef.current) {
            const container = containerRef.current.getBoundingClientRect();
            setDimensions({
              width: container.width,
              height: 400 // Keep consistent with parent container height
            });
          }
        }
      } catch (error) {
        console.error("Error accessing camera:", error);
      }
    }

    function stopCamera() {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      
      // Clear canvas and detections
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext("2d");
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
      setDetections([]);
    }

    // Start detection loop when both model and stream are ready
    async function detectFrame() {
      if (!videoRef.current || !model || !enabled || !streamRef.current) return;
      
      const predictions = await model.detect(videoRef.current);
      
      // Get the scale factors to map video coordinates to container coordinates
      const videoWidth = videoRef.current.videoWidth;
      const videoHeight = videoRef.current.videoHeight;
      const containerWidth = containerRef.current.offsetWidth;
      const containerHeight = 400; // Fixed height
      
      const scaleX = containerWidth / videoWidth;
      const scaleY = containerHeight / videoHeight;
      
      // filter & map with scaling
      const good = predictions
        .filter((p) => p.score > 0.6)
        .map((p) => ({
          class: p.class,
          x: p.bbox[0] * scaleX,
          y: p.bbox[1] * scaleY,
          w: p.bbox[2] * scaleX,
          h: p.bbox[3] * scaleY,
          originalX: p.bbox[0],
          originalY: p.bbox[1],
          originalW: p.bbox[2],
          originalH: p.bbox[3],
        }));

      // draw boxes on canvas with fixed dimensions
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext("2d");
        canvasRef.current.width = containerWidth;
        canvasRef.current.height = containerHeight;
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        good.forEach((d) => {
          ctx.strokeStyle = "#00FF00";
          ctx.lineWidth = 2;
          ctx.strokeRect(d.x, d.y, d.w, d.h);
        });
      }

      // update state & notify parent
      setDetections(good);
      good.forEach((d) => onUpdate(d.class));

      rafIdRef.current = requestAnimationFrame(detectFrame);
    }

    if (enabled) {
      startCamera().then(() => {
        if (model) detectFrame();
      });
    } else {
      stopCamera();
    }
    
  }, [model, onUpdate, enabled]);

  // We can remove the duplicate detection code from the second useEffect
  // as the first one now handles everything we need
  useEffect(() => {
    // Clean up function
    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [model, enabled, onUpdate]);

  return (
    <div 
      ref={containerRef} 
      className="relative w-full h-full overflow-hidden"
      style={{ height: '400px' }} // Force fixed height
    >
      <video 
        ref={videoRef} 
        className="w-full h-full object-cover rounded-xl" 
        style={{ 
          display: enabled ? 'block' : 'none',
          height: '400px' // Force fixed height
        }} 
      />
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 pointer-events-none" 
        style={{ 
          display: enabled ? 'block' : 'none',
          height: '400px' // Force fixed height
        }} 
      />

      {/* AR Cards */}
      {enabled && detections.map((d, i) => (
        <div
          key={`${d.class}-${i}`}
          className="absolute flex justify-center items-center pointer-events-none"
          style={{
            left: `${Math.min(dimensions.width - 100, Math.max(0, d.x))}px`,
            top: `${Math.min(dimensions.height - 40, Math.max(0, d.y - 30))}px`,
            maxWidth: '100px'
          }}
        >
          <p className="font-xl px-2 py-1 bg-black bg-opacity-70 text-white rounded text-sm">
            {d.class}
          </p>
        </div>
      ))}
    </div>
  );
}
