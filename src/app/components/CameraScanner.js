import { useRef, useEffect, useState } from "react";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-webgl";
import * as cocoSsd from "@tensorflow-models/coco-ssd";

export default function CameraScanner({ onUpdate }) {
  const videoRef = useRef();
  const canvasRef = useRef();
  const [model, setModel] = useState(null);
  const [detections, setDetections] = useState([]); // <-- track each frame

  // load model
  useEffect(() => {
    cocoSsd.load().then(setModel);
  }, []);

  // once model is ready
  useEffect(() => {
    if (!model) return;
    let rafId;

    async function setup() {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
      await new Promise((r) => (videoRef.current.onloadedmetadata = r));
      videoRef.current.play();
      detectFrame();
    }

    async function detectFrame() {
      const predictions = await model.detect(videoRef.current);
      // filter & map
      const good = predictions
        .filter((p) => p.score > 0.6)
        .map((p) => ({
          class: p.class,
          x: p.bbox[0],
          y: p.bbox[1],
          w: p.bbox[2],
          h: p.bbox[3],
        }));

      // draw boxes on canvas
      const ctx = canvasRef.current.getContext("2d");
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      good.forEach((d) => {
        ctx.strokeStyle = "#00FF00";
        ctx.lineWidth = 2;
        ctx.strokeRect(d.x, d.y, d.w, d.h);
      });

      // update state & notify parent
      setDetections(good);
      good.forEach((d) => onUpdate(d.class));

      rafId = requestAnimationFrame(detectFrame);
    }

    setup();
    return () => cancelAnimationFrame(rafId);
  }, [model, onUpdate]);

  return (
    <div className="relative w-full h-full">
      <video ref={videoRef} className="w-full rounded-xl" />
      <canvas ref={canvasRef} className="absolute inset-0 hidden" />

      {/* AR Cards */}
      {detections.map((d, i) => (
        <div
          key={`${d.class}-${i}`}
          className="absolute flex justify-center items-center"
          style={{
            left: d.x + "px",
            top: Math.max(0, d.y - 30) + "px", // 30px above box
          }}
        >
          <p className="font-xl p-5 bg-black text-white">{d.class}</p>
        </div>
      ))}
    </div>
  );
}
