"use client";

import { Check, Crop, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { Button } from "@/components/ui/button";

type CropSelection = { x: number; y: number; width: number; height: number };

export function ImageCropDialog({
  file,
  onClose,
  onConfirm,
  open,
}: {
  file: File | null;
  onClose: () => void;
  onConfirm: (file: File) => void;
  open: boolean;
}) {
  const imageRef = useRef<HTMLImageElement>(null);
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const [selection, setSelection] = useState<CropSelection | null>(null);
  const [isCropping, setIsCropping] = useState(false);
  const imageUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);

  useEffect(() => {
    return () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl);
    };
  }, [imageUrl]);

  if (!open || !file || !imageUrl) return null;

  function startSelection(event: ReactPointerEvent<HTMLDivElement>) {
    const point = getPoint(event);
    dragStart.current = point;
    setSelection({ x: point.x, y: point.y, width: 1, height: 1 });
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function moveSelection(event: ReactPointerEvent<HTMLDivElement>) {
    if (!dragStart.current) return;
    const point = getPoint(event);
    const start = dragStart.current;
    setSelection({
      x: Math.min(start.x, point.x),
      y: Math.min(start.y, point.y),
      width: Math.max(Math.abs(point.x - start.x), 1),
      height: Math.max(Math.abs(point.y - start.y), 1),
    });
  }

  function endSelection() {
    dragStart.current = null;
  }

  function getPoint(event: ReactPointerEvent<HTMLDivElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    return {
      x: Math.min(Math.max(event.clientX - bounds.left, 0), bounds.width),
      y: Math.min(Math.max(event.clientY - bounds.top, 0), bounds.height),
    };
  }

  function cropAndConfirm() {
    const currentFile = file;
    const image = imageRef.current;
    if (!currentFile || !image || !selection || selection.width < 4 || selection.height < 4) return;
    const displayWidth = image.clientWidth;
    const displayHeight = image.clientHeight;
    if (!displayWidth || !displayHeight) return;

    setIsCropping(true);
    const scaleX = image.naturalWidth / displayWidth;
    const scaleY = image.naturalHeight / displayHeight;
    const sourceX = Math.round(selection.x * scaleX);
    const sourceY = Math.round(selection.y * scaleY);
    const sourceWidth = Math.max(Math.round(selection.width * scaleX), 1);
    const sourceHeight = Math.max(Math.round(selection.height * scaleY), 1);
    const canvas = document.createElement("canvas");
    canvas.width = sourceWidth;
    canvas.height = sourceHeight;
    const context = canvas.getContext("2d");
    if (!context) {
      setIsCropping(false);
      return;
    }
    context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, sourceWidth, sourceHeight);
    canvas.toBlob((blob) => {
      setIsCropping(false);
      if (!blob) return;
      const baseName = currentFile.name.replace(/\.[^.]+$/, "");
      onConfirm(new File([blob], `${baseName}-素材选区.png`, { type: "image/png" }));
    }, "image/png");
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-4">
      <section className="grid max-h-[92vh] w-full max-w-4xl grid-rows-[auto_1fr_auto] overflow-hidden rounded-lg bg-white shadow-2xl">
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <div><h2 className="text-base font-semibold text-slate-950">裁剪并保存所需区域</h2><p className="mt-1 text-sm text-slate-500">框选需要保存的区域，系统会把选区做成公开素材。</p></div>
          <button aria-label="关闭裁剪" className="grid h-9 w-9 place-items-center rounded-md text-slate-500 hover:bg-slate-100" onClick={onClose} type="button"><X className="h-5 w-5" /></button>
        </div>
        <div className="overflow-auto bg-slate-100 p-5">
          <div className="mx-auto w-fit max-w-full select-none" onPointerDown={startSelection} onPointerMove={moveSelection} onPointerUp={endSelection}>
            <div className="relative cursor-crosshair">
              <img alt="上传素材裁剪预览" className="block max-h-[62vh] max-w-full" draggable={false} onLoad={(event) => { const { clientWidth, clientHeight } = event.currentTarget; setSelection({ x: clientWidth * 0.1, y: clientHeight * 0.1, width: clientWidth * 0.8, height: clientHeight * 0.8 }); }} ref={imageRef} src={imageUrl} />
              {selection ? <div className="pointer-events-none absolute border-2 border-blue-500 bg-blue-400/15" style={{ height: selection.height, left: selection.x, top: selection.y, width: selection.width }} /> : null}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-4">
          <Button onClick={onClose} type="button" variant="secondary">取消</Button>
          <Button className="gap-2" disabled={!selection || isCropping} onClick={cropAndConfirm} type="button"><Crop className="h-4 w-4" />{isCropping ? "正在裁剪" : "保存选区"}<Check className="h-4 w-4" /></Button>
        </div>
      </section>
    </div>
  );
}
