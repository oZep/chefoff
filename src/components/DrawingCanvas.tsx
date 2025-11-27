import { useRef, useEffect, useState } from 'react';

interface DrawingCanvasProps {
  onDrawingComplete: (drawing: string) => void;
  prompt: string;
  timeRemaining: number;
  isSubmitted: boolean;
}

export default function DrawingCanvas({ onDrawingComplete, prompt, timeRemaining, isSubmitted }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentColor, setCurrentColor] = useState('#000000');
  const [penSize, setPenSize] = useState(3);

  // Color palette options
  const colors = [
    '#000000', // Black
    '#FF0000', // Red
    '#00FF00', // Green
    '#0000FF', // Blue
    '#FFFF00', // Yellow
    '#FF00FF', // Magenta
    '#00FFFF', // Cyan
    '#FFA500', // Orange
    '#800080', // Purple
    '#FFC0CB', // Pink
    '#A52A2A', // Brown
    '#808080'  // Gray
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set up canvas
    canvas.width = 800;
    canvas.height = 600;
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isSubmitted) return;
    setIsDrawing(true);
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || isSubmitted) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = currentColor;
    
    ctx.lineWidth = penSize;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    if (isSubmitted) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const submitDrawing = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const dataURL = canvas.toDataURL();
    onDrawingComplete(dataURL);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-4xl font-black text-purple-900 mb-2">Draw Your Creation!</h1>
          <p className="text-2xl font-semibold text-purple-700 mb-4">"{prompt}"</p>
          <div className={`text-3xl font-bold ${timeRemaining <= 10 ? 'text-red-600' : 'text-purple-600'}`}>
            Time: {formatTime(timeRemaining)}
          </div>
        </div>

        {/* Drawing Area */}
        <div className="bg-white rounded-2xl p-6 shadow-2xl">
          <canvas
            ref={canvasRef}
            className={`border-2 border-gray-300 rounded-lg mx-auto block ${isSubmitted ? 'opacity-50 cursor-not-allowed' : 'cursor-crosshair'}`}
            style={{ maxWidth: '100%', height: 'auto' }}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
          />

          {/* Tools */}
          {!isSubmitted && (
            <div className="flex flex-col items-center space-y-4 mt-6">
              {/* Color Palette */}
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-gray-700">Colors:</span>
                <div className="flex space-x-2">
                  {colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setCurrentColor(color)}
                      className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${
                        currentColor === color ? 'border-gray-800 scale-110' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>

              {/* Size and Actions */}
              <div className="flex justify-center items-center space-x-6">

                <div className="flex items-center space-x-2">
                  <label className="font-semibold text-gray-700">Size:</label>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={penSize}
                    onChange={(e) => setPenSize(parseInt(e.target.value))}
                    className="w-20"
                  />
                  <span className="text-gray-700">{penSize}px</span>
                </div>

                <button
                  onClick={clearCanvas}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold"
                >
                    Clear
                </button>

                <button
                  onClick={submitDrawing}
                  className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg font-bold text-lg"
                >
                  Submit
                </button>
              </div>
            </div>
          )}

          {isSubmitted && (
            <div className="text-center mt-6">
              <div className="text-2xl font-bold text-green-600 mb-2">Drawing Submitted!</div>
              <p className="text-gray-700">Waiting for other players to finish...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}