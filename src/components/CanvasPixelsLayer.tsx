// src/components/CanvasPixelsLayer.tsx
import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import { GRID_STEP_DEG } from "../lib/grid";

type Pixel = { lat: number; lng: number; color: number };
type Props = { pixels: Pixel[] };

function toCss(c: number) {
  const hue = ((c % 256) * 1.4) % 360;
  return `hsl(${hue} 80% 55%)`;
}

export default function CanvasPixelsLayer({ pixels }: Props) {
  const map = useMap();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawRef = useRef<(() => void) | null>(null);
  const pixelsRef = useRef<Pixel[]>([]);
  const paneId = "pixel-canvas-pane";

  useEffect(() => {
    pixelsRef.current = pixels;
    drawRef.current?.();
  }, [pixels]);

  useEffect(() => {
    let pane = map.getPane(paneId);
    if (!pane) {
      pane = map.createPane(paneId);
      pane.style.zIndex = "450";
      pane.style.pointerEvents = "none";
    }
    const canvas = document.createElement("canvas");
    canvas.style.position = "absolute";
    canvas.style.top = "0";
    canvas.style.left = "0";
    const size = map.getSize();
    canvas.width = size.x;
    canvas.height = size.y;
    pane.appendChild(canvas);
    canvasRef.current = canvas;

    const draw = () => {
      if (!canvasRef.current) return;
      const ctx = canvasRef.current.getContext("2d")!;
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

      // cada pixel vira uma célula: [lat±step/2, lng±step/2]
      const half = GRID_STEP_DEG / 2;

      for (const px of pixelsRef.current) {
        const latMin = px.lat - half;
        const latMax = px.lat + half;
        const lngMin = px.lng - half;
        const lngMax = px.lng + half;

        // converte os 4 cantos para layer points
        const tl = map.latLngToLayerPoint([latMax, lngMin]); // top-left
        const br = map.latLngToLayerPoint([latMin, lngMax]); // bottom-right

        const w = br.x - tl.x;
        const h = br.y - tl.y;

        ctx.fillStyle = toCss(px.color);
        ctx.fillRect(tl.x, tl.y, w, h);
      }
    };
    drawRef.current = draw;

    const resize = () => {
      if (!canvasRef.current) return;
      const s = map.getSize();
      canvasRef.current.width = s.x;
      canvasRef.current.height = s.y;
      drawRef.current?.();
    };

    map.whenReady(() => drawRef.current?.());
    map.on("moveend", () => drawRef.current?.());
    map.on("zoomend", resize);
    map.on("resize", resize);

    drawRef.current?.();

    return () => {
      map.off("moveend");
      map.off("zoomend", resize);
      map.off("resize", resize);
      canvas.remove();
      drawRef.current = null;
      canvasRef.current = null;
    };
  }, [map]);

  return null;
}
