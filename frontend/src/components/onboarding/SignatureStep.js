import React, { useRef, useState, useEffect } from 'react';
import { Box, Button, Typography, Paper } from '@mui/material';

export default function SignatureStep({ onNext, onBack }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const startDrawing = (e) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleNext = () => {
    if (!hasSignature) {
      alert('Please provide your digital signature');
      return;
    }
    
    const signature = canvasRef.current?.toDataURL();
    onNext({ signature });
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>Digital Signature</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Please sign below to confirm that all information provided is accurate and complete.
      </Typography>

      <Paper sx={{ p: 2, border: '1px solid #ccc', textAlign: 'center' }}>
        <canvas
          ref={canvasRef}
          width={600}
          height={200}
          style={{ border: '1px solid #ddd', cursor: 'crosshair' }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={(e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousedown', {
              clientX: touch.clientX,
              clientY: touch.clientY
            });
            canvasRef.current.dispatchEvent(mouseEvent);
          }}
          onTouchMove={(e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousemove', {
              clientX: touch.clientX,
              clientY: touch.clientY
            });
            canvasRef.current.dispatchEvent(mouseEvent);
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            const mouseEvent = new MouseEvent('mouseup', {});
            canvasRef.current.dispatchEvent(mouseEvent);
          }}
        />
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          Sign above using your mouse or touch screen
        </Typography>
      </Paper>

      <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
        <Button variant="outlined" onClick={handleClear}>
          Clear
        </Button>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button onClick={onBack}>Back</Button>
        <Button variant="contained" onClick={handleNext} disabled={!hasSignature}>
          Complete Onboarding
        </Button>
      </Box>
    </Box>
  );
}

