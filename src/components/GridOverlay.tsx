import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import { GRID_STEP_DEG } from "../lib/grid";

type Props = {
  show: boolean;
  stepDeg?: number;
  gridColor?: string; // cor do grid
  gridAlpha?: number; // opacidade do grid
  reticleColor?: string; // cor do retículo
};

export default function GridOverlay({
  show,
  stepDeg = GRID_STEP_DEG,
  gridColor = "#000",
  gridAlpha = 0.18,
  reticleColor = "#000",
}: Props) {
  const map = useMap();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const paneId = "mapix-grid-overlay";
  const lastCellRef = useRef<{ lat: number; lng: number } | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    let pane = map.getPane(paneId);
    if (!pane) {
      pane = map.createPane(paneId);
      pane.style.zIndex = "600"; // acima do canvas de pixels
      pane.style.pointerEvents = "none";
    }
    const canvas = document.createElement("canvas");
    canvas.style.position = "absolute";
    canvas.style.top = "0";
    canvas.style.left = "0";
    pane.appendChild(canvas);
    canvasRef.current = canvas;

    const resize = () => {
      if (!canvasRef.current) return;
      const s = map.getSize();
      canvasRef.current.width = s.x;
      canvasRef.current.height = s.y;
    };

    const clear = (ctx: CanvasRenderingContext2D) =>
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    const drawReticle = (
      ctx: CanvasRenderingContext2D,
      lat: number,
      lng: number
    ) => {
      const pt = map.latLngToLayerPoint([lat, lng]);
      const r = 10; // “raio” do retículo
      const g = 4; // “gap” no centro
      ctx.save();
      ctx.strokeStyle = reticleColor;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.9;

      // 4 cantos (como no seu print)
      // canto superior
      ctx.beginPath();
      ctx.moveTo(pt.x - r, pt.y - r);
      ctx.lineTo(pt.x - g, pt.y - r);
      ctx.moveTo(pt.x + g, pt.y - r);
      ctx.lineTo(pt.x + r, pt.y - r);
      // canto direito
      ctx.moveTo(pt.x + r, pt.y - r);
      ctx.lineTo(pt.x + r, pt.y - g);
      ctx.moveTo(pt.x + r, pt.y + g);
      ctx.lineTo(pt.x + r, pt.y + r);
      // canto inferior
      ctx.moveTo(pt.x + r, pt.y + r);
      ctx.lineTo(pt.x + g, pt.y + r);
      ctx.moveTo(pt.x - g, pt.y + r);
      ctx.lineTo(pt.x - r, pt.y + r);
      // canto esquerdo
      ctx.moveTo(pt.x - r, pt.y + r);
      ctx.lineTo(pt.x - r, pt.y + g);
      ctx.moveTo(pt.x - r, pt.y - g);
      ctx.lineTo(pt.x - r, pt.y - r);

      ctx.stroke();
      ctx.restore();
    };

    const draw = () => {
      if (!canvasRef.current) return;
      const ctx = canvasRef.current.getContext("2d")!;
      clear(ctx);
      if (!show) return;

      // retículo na célula atual
      const cell = lastCellRef.current;
      if (cell) drawReticle(ctx, cell.lat, cell.lng);
    };

    const onMouseMove = (ev: L.LeafletMouseEvent) => {
      if (!show) return;
      const step = stepDeg;
      const q = (n: number) => Math.round(n / step) * step;
      const lat = q(ev.latlng.lat);
      const lng = q(ev.latlng.lng);
      const same =
        lastCellRef.current &&
        lastCellRef.current.lat === lat &&
        lastCellRef.current.lng === lng;
      if (!same) lastCellRef.current = { lat, lng };
    };

    const loop = () => {
      draw();
      rafRef.current = requestAnimationFrame(loop);
    };

    // init
    const onResize = () => {
      resize();
      draw();
    };
    resize();
    map.on("mousemove", onMouseMove);
    map.on("moveend zoomend resize", onResize);
    map.whenReady(() => {
      draw();
      loop();
    });

    return () => {
      map.off("mousemove", onMouseMove);
      map.off("moveend zoomend resize", onResize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      canvas.remove();
      canvasRef.current = null;
    };
  }, [map, show, stepDeg, gridColor, gridAlpha, reticleColor]);

  return null;
}
