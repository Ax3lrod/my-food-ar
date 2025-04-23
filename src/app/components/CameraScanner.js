'use client';
import { useRef, useEffect, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';
import * as cocoSsd from '@tensorflow-models/coco-ssd';

export default function CameraScanner({ onUpdate }) {
  const videoRef = useRef();
  const canvasRef = useRef();
  const [model, setModel] = useState(null);

  useEffect(() => {
    cocoSsd.load().then(setModel);
  }, []);

  useEffect(() => {
    if (!model) return;
    let animationId;
    async function setup() {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
      await new Promise(r => videoRef.current.onloadedmetadata = r);
      videoRef.current.play();
      detect();
    }

    async function detect() {
      const predictions = await model.detect(videoRef.current);
      const ctx = canvasRef.current.getContext('2d');
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

      predictions.forEach(pred => {
        if (pred.score > 0.6) {
          const [x, y, w, h] = pred.bbox;
          ctx.strokeStyle = '#00FF00';
          ctx.lineWidth = 2;
          ctx.strokeRect(x, y, w, h);
          ctx.font = '18px Arial';
          ctx.fillStyle = '#00FF00';
          ctx.fillText(pred.class, x, y - 5);
          onUpdate(pred.class);
        }
      });
      animationId = requestAnimationFrame(detect);
    }

    setup();
    return () => cancelAnimationFrame(animationId);
  }, [model, onUpdate]);

  return (
    <div className="relative">
      <video ref={videoRef} className="w-full rounded-xl" />
      <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full" />
    </div>
  );
}