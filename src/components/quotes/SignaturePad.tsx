import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface SignaturePadProps {
  onConfirm: (signatureDataUrl: string) => void;
  onCancel: () => void;
  disabled?: boolean;
  width?: number;
  height?: number;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({
  onConfirm,
  onCancel,
  disabled = false,
  width = 400,
  height = 180,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  const getCtx = useCallback(() => canvasRef.current?.getContext('2d'), []);

  const startDrawing = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (disabled) return;
      e.preventDefault();
      const ctx = getCtx();
      if (!ctx || !canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const x = ('touches' in e ? e.touches[0].clientX : e.clientX) - rect.left;
      const y = ('touches' in e ? e.touches[0].clientY : e.clientY) - rect.top;
      ctx.beginPath();
      ctx.moveTo(x, y);
      setIsDrawing(true);
      setHasDrawn(true);
    },
    [disabled, getCtx]
  );

  const draw = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!isDrawing || disabled) return;
      e.preventDefault();
      const ctx = getCtx();
      if (!ctx || !canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const x = ('touches' in e ? e.touches[0].clientX : e.clientX) - rect.left;
      const y = ('touches' in e ? e.touches[0].clientY : e.clientY) - rect.top;
      ctx.lineTo(x, y);
      ctx.stroke();
    },
    [isDrawing, disabled, getCtx]
  );

  const stopDrawing = useCallback(() => setIsDrawing(false), []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = width;
    canvas.height = height;
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
  }, [width, height]);

  const handleConfirm = () => {
    if (!canvasRef.current || !hasDrawn) return;
    const dataUrl = canvasRef.current.toDataURL('image/png');
    onConfirm(dataUrl);
  };

  const handleClear = () => {
    const ctx = getCtx();
    if (!ctx || !canvasRef.current) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    setHasDrawn(false);
  };

  return (
    <div className="space-y-4">
      <div
        className="rounded-lg border-2 border-dashed border-gray-300 bg-white overflow-hidden touch-none"
        style={{ width, height }}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      >
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="block w-full h-full cursor-crosshair"
          style={{ width, height }}
        />
      </div>
      <p className="text-sm text-gray-500">Signez avec votre doigt ou la souris dans la zone ci-dessus</p>
      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" onClick={handleClear} disabled={disabled}>
          Effacer
        </Button>
        <Button type="button" onClick={handleConfirm} disabled={disabled || !hasDrawn}>
          Confirmer et accepter
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel} disabled={disabled}>
          Annuler
        </Button>
      </div>
    </div>
  );
};
