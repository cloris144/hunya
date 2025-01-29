import { MoreHorizontal, Upload, User, Search, PenSquare, HelpCircle, X } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import mammoth from "mammoth";
import ReactCrop, { centerCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

function centerInitialCrop(mediaWidth, mediaHeight) {
  return centerCrop(
    {
      unit: '%',
      width: 30,
      height: 30,
      x: 35,
      y: 35
    },
    mediaWidth,
    mediaHeight
  );
}

export default function ChatInterface() {
  const fileInputRef = useRef(null);
  const imgRef = useRef(null);
  const containerRef = useRef(null);
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showHelp, setShowHelp] = useState(false);
  
  // Image cropping states
  const [imgSrc, setImgSrc] = useState('');
  const [crop, setCrop] = useState();
  const [scale, setScale] = useState(1);
  const [completedCrop, setCompletedCrop] = useState(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      navigate('/login');
    }
  }, [navigate]);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file.name);

      if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
        const reader = new FileReader();
        reader.onload = (e) => {
          mammoth
            .convertToHtml({ arrayBuffer: e.target.result })
            .then((result) => {
              setFileContent(result.value);
            })
            .catch((err) => console.error("Error converting docx:", err));
        };
        reader.readAsArrayBuffer(file);
      }
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.addEventListener('load', () => {
      setImgSrc(reader.result?.toString() || '');
    });
    reader.readAsDataURL(file);
  };

  const onImageLoad = (e) => {
    const { width, height } = e.currentTarget;
    setCrop(centerInitialCrop(width, height));
    setPosition({ x: 0, y: 0 });
  };

  const handleCropChange = (_, percentCrop) => {
    // Minimum size in percentage (30% of the image)
    const MIN_SIZE = 10;

    let newCrop = { ...percentCrop };

    // Enforce minimum width
    if (percentCrop.width < MIN_SIZE) {
      newCrop.width = MIN_SIZE;
      // Adjust x position to keep the crop within bounds
      newCrop.x = Math.min(percentCrop.x, 100 - MIN_SIZE);
    }

    // Enforce minimum height
    if (percentCrop.height < MIN_SIZE) {
      newCrop.height = MIN_SIZE;
      // Adjust y position to keep the crop within bounds
      newCrop.y = Math.min(percentCrop.y, 100 - MIN_SIZE);
    }

    setCrop(newCrop);
  };

  const handleZoomChange = (e) => {
    setScale(Number(e.target.value));
    setPosition({ x: 0, y: 0 });
  };

  const handleWheel = (e) => {
    e.preventDefault();
    
    const delta = e.deltaY;
    const ZOOM_SPEED = 0.1;
    
    setScale(prevScale => {
      const newScale = delta > 0 
        ? Math.max(0.1, prevScale - ZOOM_SPEED)  // Zoom out
        : Math.min(3, prevScale + ZOOM_SPEED);   // Zoom in
      return newScale;
    });
  };

  const handleMouseDown = (e) => {
    // Only allow dragging if right-clicking on the image itself
    if (e.target.tagName === 'IMG') {
      e.preventDefault();
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      setPosition({ x: newX, y: newY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const clearImage = () => {
    setImgSrc('');
    setCrop(undefined);
    setScale(1);
    setCompletedCrop(null);
    setPosition({ x: 0, y: 0 });
  };

  const handleVerify = () => {
    if (!selectedFile || !imgSrc) {
      setErrorMessage("請確保已上傳文件和影像！");
      return;
    }

    setErrorMessage("");
    
    if (!completedCrop || !imgRef.current) {
      console.log("full");
    } else {
      const imageElement = imgRef.current;
      const { naturalWidth, naturalHeight } = imageElement;
      
      const x_min = Math.round((completedCrop.x / 100) * naturalWidth);
      const y_min = Math.round((completedCrop.y / 100) * naturalHeight);
      const x_max = Math.round(((completedCrop.x + completedCrop.width) / 100) * naturalWidth);
      const y_max = Math.round(((completedCrop.y + completedCrop.height) / 100) * naturalHeight);
      
      console.log(`(${x_min},${y_min},${x_max},${y_max})`);
    }
    
    alert("驗證成功！");
  };

  // Attach event listeners to document only when dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart]);

  return (
    <div className="flex min-h-screen bg-gray-800 text-white overflow-hidden">
      {/* Left sidebar */}
      <div className="w-52 border-r border-gray-700 flex flex-col">
        {/* Top navigation */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5" />
            <span>brian</span>
          </div>
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            <PenSquare className="w-5 h-5" />
          </div>
        </div>

        {/* Message list */}
        <div className="flex-1 p-2 overflow-y-auto">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="flex items-center justify-between p-3 hover:bg-gray-700 rounded-lg cursor-pointer"
            >
              <span>七七乳</span>
              <MoreHorizontal className="w-5 h-5 text-gray-400" />
            </div>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col bg-gray-800 overflow-hidden">
        {/* Upload area */}
        <div className="flex-1 p-8 flex items-center justify-center gap-8">
          {/* Document upload area */}
          <div 
            className="w-full max-w-2xl h-full border-2 border-dashed border-gray-600 rounded-lg flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-gray-500 transition-colors"
            onClick={handleUploadClick}
          >
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileChange}
              accept=".docx"
            />

            <div className="w-full max-w-2xl mt-2 overflow-auto h-full border-gray-600 rounded-lg p-4">
              {fileContent ? (
                <div
                  className="text-gray-300"
                  dangerouslySetInnerHTML={{ __html: fileContent }}
                />
              ) : (
                <div className="w-full max-w-2xl h-full flex flex-col items-center justify-center gap-4">
                  <Upload className="w-8 h-8 text-gray-400" />
                  <span className="text-gray-300">上傳文件</span>
                </div>
              )}
            </div>
          </div>

          {/* Image upload and results area */}
          <div className="flex-1 flex flex-col gap-8 w-full max-w-2xl h-full">
            {/* Image upload area */}
            <div 
              ref={containerRef}
              className="w-full max-w-2xl h-2/3 border-2 border-dashed border-gray-600 rounded-lg overflow-hidden"
              onContextMenu={(e) => e.preventDefault()}
            >
              {!imgSrc ? (
                <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-gray-700/10">
                  <Upload className="w-8 h-8 text-gray-400" />
                  <span className="text-gray-300 mt-2">上傳影像</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              ) : (
                <div className="h-full flex flex-col">
                  <div 
                    className="flex-1 overflow-hidden flex items-center justify-center bg-gray-900 relative"
                    onWheel={handleWheel}
                  >
                    {/* Help and clear buttons container */}
                    <div className="absolute top-2 right-2 z-10 flex gap-2">
                      <button
                        onClick={clearImage}
                        className="p-2 bg-gray-800/80 rounded-full hover:bg-gray-700/80 transition-colors"
                        title="清除影像"
                      >
                        <X className="w-5 h-5 text-gray-300" />
                      </button>
                      <button
                        onClick={() => setShowHelp(!showHelp)}
                        className="p-2 bg-gray-800/80 rounded-full hover:bg-gray-700/80 transition-colors"
                      >
                        <HelpCircle className="w-5 h-5 text-gray-300" />
                      </button>
                    </div>

                    {/* Help overlay */}
                    {showHelp && (
                      <div className="absolute inset-0 bg-gray-900/90 z-20 p-6 overflow-y-auto">
                        <div className="bg-gray-800 rounded-lg p-6 text-gray-300 space-y-4">
                          <h3 className="text-lg font-semibold mb-4">操作說明</h3>
                          <div className="space-y-3">
                            <p>• <span className="font-medium">拖曳框選區域：</span>點擊並拖曳可建立選取區域，調整框的大小來選擇要驗證的部分</p>
                            <p>• <span className="font-medium">縮放影像：</span>使用滑鼠滾輪或底部的縮放滑桿來放大/縮小影像</p>
                            <p>• <span className="font-medium">移動影像：</span>按住滑鼠右鍵並拖曳可移動整個影像位置</p>
                            <p>• <span className="font-medium">最小選取大小：</span>選取區域至少需要占整張圖片的 10%</p>
                          </div>
                          <button
                            onClick={() => setShowHelp(false)}
                            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-md transition-colors"
                          >
                            了解
                          </button>
                        </div>
                      </div>
                    )}

                    <ReactCrop
                      crop={crop}
                      onChange={handleCropChange}
                      onComplete={(c) => setCompletedCrop(c)}
                      minHeight={10}
                      minWidth={10}
                      keepSelection={true}
                    >
                      <img
                        ref={imgRef}
                        alt="Crop"
                        src={imgSrc}
                        style={{ 
                          transform: `scale(${scale}) translate(${position.x}px, ${position.y}px)`,
                          transition: isDragging ? 'none' : 'transform 0.3s'
                        }}
                        onLoad={onImageLoad}
                        onMouseDown={handleMouseDown}
                        className="max-h-full max-w-full object-contain"
                        draggable={false}
                      />
                    </ReactCrop>
                  </div>
                  
                  <div className="p-4 bg-gray-800 border-t border-gray-700">
                    <div className="flex items-center gap-4">
                      <span className="text-gray-300 whitespace-nowrap">縮放:</span>
                      <input
                        type="range"
                        min="0.1"
                        max="3"
                        step="0.1"
                        value={scale}
                        onChange={handleZoomChange}
                        className="w-full"
                      />
                      <span className="text-gray-300 w-12">{scale.toFixed(2)}x</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Results area */}
            <div className="w-full max-w-2xl h-1/3 border-2 border-gray-600 rounded-lg flex flex-col items-center justify-center gap-4">
              <span className="text-gray-300">結果</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-800 border-t border-gray-700">
          <div className="max-w-7xl mx-auto flex flex-col items-center gap-2">
            <button
              onClick={handleVerify}
              className="px-12 py-2 bg-blue-800 hover:bg-blue-500 rounded-lg text-white transition-colors"
            >
              驗證
            </button>
            {errorMessage && (
              <div className="text-red-500">{errorMessage}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}