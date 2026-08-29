import { useCallback, useEffect, useRef, useState } from 'react';

// Auto-completes once ~80% of the canvas is erased, so the reveal doesn't
// require scratching every last pixel clean.
const CLEAR_THRESHOLD = 0.8;
// Sampling every 4th pixel (not every pixel) keeps getImageData cheap enough
// to run mid-scratch without visibly lagging the canvas.
const SAMPLE_STEP = 4;
// Recomputing the scratched percentage on every single move event is
// wasteful — only check every few strokes, plus always on release.
const CHECK_EVERY_N_STROKES = 4;

// A reusable metallic scratch-off canvas: draws a silver layer over `quote`,
// tracks how much of it a mouse/touch drag has erased, and fires
// `onRevealed` once the clear threshold is crossed.
function ScratchCard({ quote, label = 'Scratch to reveal ✨', onRevealed, className = '' }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef(null);
  const strokeCountRef = useRef(0);
  const [isCleared, setIsCleared] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const { clientWidth, clientHeight } = containerRef.current;
    canvas.width = clientWidth;
    canvas.height = clientHeight;

    const ctx = canvas.getContext('2d');
    const metallic = ctx.createLinearGradient(0, 0, clientWidth, clientHeight);
    metallic.addColorStop(0, '#f1f1f5');
    metallic.addColorStop(0.35, '#c3c3cc');
    metallic.addColorStop(0.65, '#e6e6ec');
    metallic.addColorStop(1, '#b0b0ba');
    ctx.fillStyle = metallic;
    ctx.fillRect(0, 0, clientWidth, clientHeight);

    ctx.fillStyle = 'rgba(50, 50, 60, 0.7)';
    ctx.font = `600 ${Math.max(clientWidth * 0.055, 15)}px 'Quicksand', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, clientWidth / 2, clientHeight / 2);
  }, [label]);

  const pointFromClient = useCallback((clientX, clientY) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * canvas.width,
      y: ((clientY - rect.top) / rect.height) * canvas.height,
    };
  }, []);

  const checkClearedPercentage = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let transparent = 0;
    let sampled = 0;
    for (let i = 3; i < data.length; i += 4 * SAMPLE_STEP) {
      sampled++;
      if (data[i] < 30) transparent++;
    }
    if (sampled > 0 && transparent / sampled >= CLEAR_THRESHOLD) {
      setIsCleared(true);
    }
  }, []);

  const scratchAt = useCallback((x, y) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const brushSize = Math.max(Math.min(canvas.width, canvas.height) * 0.12, 26);
    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.lineWidth = brushSize;
    const last = lastPointRef.current;
    ctx.beginPath();
    ctx.moveTo(last ? last.x : x, last ? last.y : y);
    ctx.lineTo(x, y);
    ctx.stroke();
    lastPointRef.current = { x, y };

    strokeCountRef.current += 1;
    if (strokeCountRef.current % CHECK_EVERY_N_STROKES === 0) {
      checkClearedPercentage();
    }
  }, [checkClearedPercentage]);

  const startScratch = useCallback((clientX, clientY) => {
    isDrawingRef.current = true;
    lastPointRef.current = null;
    const { x, y } = pointFromClient(clientX, clientY);
    scratchAt(x, y);
  }, [pointFromClient, scratchAt]);

  const moveScratch = useCallback((clientX, clientY) => {
    if (!isDrawingRef.current) return;
    const { x, y } = pointFromClient(clientX, clientY);
    scratchAt(x, y);
  }, [pointFromClient, scratchAt]);

  const endScratch = useCallback(() => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    lastPointRef.current = null;
    checkClearedPercentage();
  }, [checkClearedPercentage]);

  // Touch scratching needs a real (non-passive) 'touchmove' listener so
  // preventDefault() can stop the page from scrolling under the finger —
  // React's JSX touch handlers are registered passively and can't do that.
  useEffect(() => {
    const canvas = canvasRef.current;
    const handleTouchMove = (event) => {
      event.preventDefault();
      const touch = event.touches[0];
      if (touch) moveScratch(touch.clientX, touch.clientY);
    };
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    return () => canvas.removeEventListener('touchmove', handleTouchMove);
  }, [moveScratch]);

  useEffect(() => {
    if (!isCleared) return;
    const timeout = setTimeout(() => onRevealed?.(), 600);
    return () => clearTimeout(timeout);
  }, [isCleared, onRevealed]);

  return (
    <div className={`scratch-card ${className}`} ref={containerRef}>
      <p className="scratch-card__quote">{quote}</p>
      <canvas
        ref={canvasRef}
        className={`scratch-card__canvas ${isCleared ? 'scratch-card__canvas--cleared' : ''}`}
        onMouseDown={(e) => startScratch(e.clientX, e.clientY)}
        onMouseMove={(e) => moveScratch(e.clientX, e.clientY)}
        onMouseUp={endScratch}
        onMouseLeave={endScratch}
        onTouchStart={(e) => {
          const touch = e.touches[0];
          if (touch) startScratch(touch.clientX, touch.clientY);
        }}
        onTouchEnd={endScratch}
      />
    </div>
  );
}

export default ScratchCard;
