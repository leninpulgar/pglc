'use client';
import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/button';
import { trackEvent } from '@/utils/analytics';


export default function BadgeCreator() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [canvasWidth, setCanvasWidth] = useState(1200); // Default width
  const [canvasHeight, setCanvasHeight] = useState(627); // Default height
  const [profileImage, setProfileImage] = useState<string | null>('/placeholder-avatar.png');
  const [profileImageName, setProfileImageName] = useState('');
  const [name, setName] = useState('Your name and title');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  // Handle resizing of avatar image
  const [imageOffset, setImageOffset] = useState({ x: 0, y: 0 });
  const [imageScale, setImageScale] = useState(1);

  // Allow resizing of the image with the mouse
  const isDragging = useRef(false);
  const lastPosition = useRef({ x: 0, y: 0 });

  const lastDistance = useRef<number | null>(null);

  const getTouchDistance = (e: TouchEvent | React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length < 2) return null;
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const preventDefaultTouch = (e: TouchEvent) => {
    if (e.touches.length > 1) {
      e.preventDefault();
    }
  };

  // 🔸 NEW: improved iOS gesture override using document-level event listener
  useEffect(() => {
    const preventGesture = (e: TouchEvent) => {
      if (e.touches.length > 1) e.preventDefault();
    };

    // Add event listeners for non-standard gesture events
    document.addEventListener("gesturestart", preventGesture as EventListener, { passive: false });
    document.addEventListener("gesturechange", preventGesture as EventListener, { passive: false });
    document.addEventListener("touchmove", preventGesture as EventListener, { passive: false });

    return () => {
      document.removeEventListener("gesturestart", preventGesture as EventListener);
      document.removeEventListener("gesturechange", preventGesture as EventListener);
      document.removeEventListener("touchmove", preventGesture as EventListener);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // 🔹 FIX: block default zoom gesture on iOS (Safari & Chrome) reliably
    const opts = { passive: false } as EventListenerOptions;
    canvas.addEventListener('touchstart', preventDefaultTouch, opts);
    canvas.addEventListener('touchmove', preventDefaultTouch, opts);

    return () => {
      canvas.removeEventListener('touchstart', preventDefaultTouch);
      canvas.removeEventListener('touchmove', preventDefaultTouch);
    };
  }, []);

  const startDragging = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    isDragging.current = true;
    if ('touches' in e) {
      lastPosition.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      lastDistance.current = getTouchDistance(e);
    } else {
      lastPosition.current = { x: e.clientX, y: e.clientY };
    }
  };

  const stopDragging = () => {
    isDragging.current = false;
    lastDistance.current = null;
  };

  const onDrag = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDragging.current) return;

    if ('touches' in e) {
      if (e.touches.length === 2) {
        const currentDistance = getTouchDistance(e);
        if (lastDistance.current !== null && currentDistance !== null) {
          const delta = currentDistance - lastDistance.current;
          setImageScale((prev) => Math.max(0.1, prev + delta * 0.005));
        }
        lastDistance.current = currentDistance;
        return;
      }
      const point = e.touches[0];
      const deltaX = point.clientX - lastPosition.current.x;
      const deltaY = point.clientY - lastPosition.current.y;
      setImageOffset((prev) => ({ x: prev.x + deltaX, y: prev.y + deltaY }));
      lastPosition.current = { x: point.clientX, y: point.clientY };
    } else {
      const deltaX = e.clientX - lastPosition.current.x;
      const deltaY = e.clientY - lastPosition.current.y;
      setImageOffset((prev) => ({ x: prev.x + deltaX, y: prev.y + deltaY }));
      lastPosition.current = { x: e.clientX, y: e.clientY };
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const wheelHandler = (e: WheelEvent) => {
      if (e.cancelable) e.preventDefault();
    };

    // 🔐 Register wheel as non-passive to allow preventDefault()
    canvas.addEventListener('wheel', wheelHandler, { passive: false });

    return () => {
      canvas.removeEventListener('wheel', wheelHandler);
    };
  }, []);

  // Allows zoom with wheel
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const scaleAmount = e.deltaY < 0 ? 0.05 : -0.05;
    setImageScale((prev) => Math.max(0.1, prev + scaleAmount));
  };



  const handleResize = () => {
    const screenWidth = window.innerWidth;
    const maxWidth = 1200;
    const aspectRatio = 1200 / 627;

    if (screenWidth < maxWidth) {
      setCanvasWidth(screenWidth - 20);
      setCanvasHeight((screenWidth - 20) / aspectRatio);
    } else {
      setCanvasWidth(maxWidth);
      setCanvasHeight(maxWidth / aspectRatio);
    }
  };


  useEffect(() => {
    handleResize(); // Set initial size
    window.addEventListener('resize', handleResize); // Update on resize
    return () => window.removeEventListener('resize', handleResize); // Cleanup
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileImageName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => setProfileImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = 1200 * dpr;
    canvas.height = 627 * dpr;
    canvas.style.width = `${canvasWidth}px`;
    canvas.style.height = `${canvasHeight}px`;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, 627, 1200);

    const background = new Image();
    background.src = '/im-speaking.png';
    background.onload = () => {
      ctx.drawImage(background, 0, 0, 1200, 627);

      if (profileImage) {
        const profile = new Image();
        profile.src = profileImage;
        profile.onload = () => {
          // 🔵 Posición y tamaño del círculo de avatar
          const circleX = 980; // centro horizontal (768/2)
          const circleY = 300; // ajusta según tu plantilla
          const radius = 150;

          // Calcula dimensiones de la imagen cargada
          const imgRatio = profile.width / profile.height;
          const boxSize = radius * 2;
          let drawW = boxSize;
          let drawH = boxSize;

          if (imgRatio > 1) {
            drawH = boxSize;
            drawW = boxSize * imgRatio;
          } else {
            drawW = boxSize;
            drawH = boxSize / imgRatio;
          }

          const dx = circleX - drawW / 2 + imageOffset.x;
          const dy = circleY - drawH / 2 + imageOffset.y;

          // 🔒 Clipping circular
          ctx.save();
          ctx.beginPath();
          ctx.arc(circleX, circleY, radius, 0, Math.PI * 2, true);
          ctx.clip();

          // Dibuja imagen escalada dentro del clip
          ctx.drawImage(
            profile,
            0, 0, profile.width, profile.height,
            dx, dy, drawW * imageScale, drawH * imageScale
          );

          ctx.restore(); // Libera el recorte

          // ⭕️ Dibuja el borde (stroke) de 2px alrededor del avatar
          ctx.beginPath();
          ctx.arc(circleX, circleY, radius, 0, Math.PI * 2, true);
          ctx.lineWidth = 6;
          ctx.strokeStyle = '#af018d'; // Puedes cambiar 'white' por el color que prefieras (ej. '#003366')
          ctx.stroke();

          // Añadir el nombre y título
          ctx.font = '26px sans-serif';
          ctx.fillStyle = '#fff';

          // Ajustar el texto si es demasiado largo
          const maxWidth = 318;
          const lines = [];
          let currentLine = '';
          const words = name.split(' ');

          for (const word of words) {
            const testLine = currentLine + word + ' ';
            const { width } = ctx.measureText(testLine);
            if (width > maxWidth && currentLine !== '') {
              lines.push(currentLine);
              currentLine = word + ' ';
            } else {
              currentLine = testLine;
            }
          }
          lines.push(currentLine);

          // Dibujar cada línea del nombre centrada
          ctx.textAlign = 'center';
          const centerX = 980; // Posición central para el texto
          lines.forEach((line, i) => {
            ctx.fillText(line.trim(), centerX, 490 + i * 24);
          });
        };
      }
    };
  };

  useEffect(() => {
    drawCanvas();
  }, [canvasWidth, canvasHeight, profileImage, name, imageOffset, imageScale]);

  const downloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = 'badge.png';
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <div className="flex flex-col items-center gap-4 p-6">

      <div className="flex items-center gap-2 max-w-xs w-full">
        <Button className="whitespace-nowrap text-[#003366]" onClick={() => fileInputRef.current?.click()}>Upload Image</Button>
        <input
          type="text"
          value={profileImageName}
          readOnly
          placeholder="No file selected"
          className="flex-1 border p-2 rounded text-sm text-gray-800 bg-gray-100 placeholder:text-gray-500"
        />
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          ref={fileInputRef}
          className="hidden"
        />
      </div>
      <input
        type="text"
        placeholder="Your Name and Title"
        className="border p-2 rounded placeholder:text-gray-500"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onFocus={(e) => e.target.select()}
      />

      <div className="relative border-[3px] border-gray-200 bg-white rounded-lg overflow-hidden shadow-md p-6">
        <canvas
          ref={canvasRef}
          width={canvasWidth}
          height={canvasHeight}
          className="border"
          style={{ width: canvasWidth, height: canvasHeight, cursor: 'grab' }}
          onMouseDown={startDragging}
          onMouseMove={onDrag}
          onMouseUp={stopDragging}
          onMouseLeave={stopDragging}
          onWheel={handleWheel}
        />
      </div>

      <Button className="download-now" onClick={() => {
        downloadImage();
        trackEvent('download_image', { name });
      }}>Download Image</Button>
    </div>
  );
}
