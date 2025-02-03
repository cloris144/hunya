import { MoreHorizontal, Upload, User, Search, PenSquare, HelpCircle, X } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import ReactCrop, { centerCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import VerificationList from './components/VerificationList';
import VerificationDetails from './components/VerificationDetails';
import RenameDialog from './components/RenameDialog';
import UserMenu from './components/UserMenu';

// Import pdf.js directly and set up the worker
import * as pdfjsLib from 'pdfjs-dist';
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';

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
  const canvasRef = useRef(null);
  const navigate = useNavigate();
  const [username, setUsername] = useState("Loading...");
  const [docxFile, setDocxFile] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [pdfDocument, setPdfDocument] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [showHelp, setShowHelp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isDocDragging, setIsDocDragging] = useState(false);
  const [isImageDragging, setIsImageDragging] = useState(false);
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);

  // Image cropping states
  const [imgSrc, setImgSrc] = useState('');
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState(null);
  const [selectedVerification, setSelectedVerification] = useState(null);
  const handleVerificationSelect = (verification) => {
    console.log("Selected verification:", verification); // Debug log
    setSelectedVerification(verification);
  };
  const handleCreateVerification = async (name) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://162.38.2.150:8100/verifications?verification_name=' + encodeURIComponent(name), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to create verification');
      }

      setIsRenameDialogOpen(false);

      // Find the VerificationList component and call its refresh method
      const event = new CustomEvent('refreshVerifications');
      window.dispatchEvent(event);

    } catch (error) {
      console.error('Error creating verification:', error);
      setErrorMessage('Failed to create verification');
    }
  };


  // Authentication check
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      navigate('/login');
    }
  }, [navigate]);

  // Add the new useEffect for fetching user data here 👇
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const response = await fetch('http://162.38.2.150:8100/users/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch user data');
        }

        const userData = await response.json();
        setUsername(userData.username);
      } catch (error) {
        console.error('Error fetching user data:', error);
        setUsername("Error");
      }
    };

    fetchUserData();
  }, []);

  // Drag and drop handlers
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (!file) return;

    if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      handleDocxFile(file);
    } else {
      setErrorMessage("請上傳 DOCX 格式的文件");
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  const handleDocDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDocDragging(true);
  };
  const handleDocDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDocDragging(false);
  };
  const handleDocxFile = async (file) => {
    setLoading(true);
    setErrorMessage("");
    setSelectedFile(file.name);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('http://162.38.3.101:8101/doc_to_pdf', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('PDF conversion failed');
      }

      const pdfData = await response.arrayBuffer();

      if (pdfDocument) {
        pdfDocument.destroy();
        setPdfDocument(null);
      }

      const loadingTask = pdfjsLib.getDocument({ data: pdfData });
      const pdf = await loadingTask.promise;

      setPdfDocument(pdf);
      setNumPages(pdf.numPages);
      setCurrentPage(1);

    } catch (error) {
      console.error('Error converting document:', error);
      setErrorMessage("文件轉換失敗，請稍後再試");
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } finally {
      setLoading(false);
    }
  };

  const clearPDF = (e) => {
    e.stopPropagation();

    if (pdfDocument) {
      pdfDocument.destroy();
    }
    setPdfDocument(null);
    setNumPages(null);
    setCurrentPage(1);
    setSelectedFile(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setDocxFile(null);
  };

  const handleContainerClick = () => {
    if (!pdfDocument) {
      handleUploadClick();
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };
  const handleDocDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDocDragging(false);

    const file = e.dataTransfer.files[0];
    if (!file) return;

    if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      setLoading(true);
      setErrorMessage("");
      setSelectedFile(file.name);

      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('http://162.38.3.101:8101/doc_to_pdf', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('PDF conversion failed');
        }

        const pdfData = await response.arrayBuffer();

        if (pdfDocument) {
          pdfDocument.destroy();
          setPdfDocument(null);
        }

        const loadingTask = pdfjsLib.getDocument({ data: pdfData });
        const pdf = await loadingTask.promise;

        setPdfDocument(pdf);
        setNumPages(pdf.numPages);
        setCurrentPage(1);

      } catch (error) {
        console.error('Error converting document:', error);
        setErrorMessage("文件轉換失敗，請稍後再試");
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } finally {
        setLoading(false);
      }
    } else {
      setErrorMessage("請上傳 DOCX 格式的文件");
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      handleDocxFile(file);
    } else {
      setErrorMessage("請上傳 DOCX 格式的文件");
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Function to render PDF page
  const renderPage = async (pageNum) => {
    if (!pdfDocument || !canvasRef.current) return;

    try {
      const page = await pdfDocument.getPage(pageNum);
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      const viewport = page.getViewport({ scale: 1.5 });
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };

      await page.render(renderContext).promise;
    } catch (error) {
      console.error('Error rendering PDF page:', error);
      setErrorMessage('PDF 渲染失敗');
    }
  };

  // Image handling functions
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
  };

  const handleCropChange = (_, percentCrop) => {
    const MIN_SIZE = 10;
    let newCrop = { ...percentCrop };

    if (percentCrop.width < MIN_SIZE) {
      newCrop.width = MIN_SIZE;
      newCrop.x = Math.min(percentCrop.x, 100 - MIN_SIZE);
    }

    if (percentCrop.height < MIN_SIZE) {
      newCrop.height = MIN_SIZE;
      newCrop.y = Math.min(percentCrop.y, 100 - MIN_SIZE);
    }

    setCrop(newCrop);
  };

  const clearImage = () => {
    setImgSrc('');
    setCrop(undefined);
    setCompletedCrop(null);
    setImageFile(null);
  };

  const handleVerify = async () => {
    if (!selectedVerification) {
      setErrorMessage("請先選擇一個驗證！");
      return;
    }
  
    if (!docxFile || !imageFile) {
      setErrorMessage("請確保已上傳文件和影像！");
      return;
    }
  
    if (!completedCrop || !imgRef.current) {
      setErrorMessage("請在影像上選擇驗證範圍！");
      return;
    }
  
    setLoading(true);
    setErrorMessage("");
  
    try {
      const image = imgRef.current;
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;
  
      const cropX = completedCrop.x * scaleX;
      const cropY = completedCrop.y * scaleY;
      const cropWidth = completedCrop.width * scaleX;
      const cropHeight = completedCrop.height * scaleY;
      const ocrScope = [cropX, cropY, cropWidth, cropHeight];
  
      const formData = new FormData();
      formData.append('docx_file', docxFile);
      formData.append('image_file', imageFile);
      formData.append('ocr_scope', JSON.stringify(ocrScope));
  
      const token = localStorage.getItem('access_token');
      const response = await fetch(
        `http://162.38.2.150:8100/verifications/${selectedVerification.id}/upload`,
        {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData,
        }
      );
  
      if (!response.ok) throw new Error('驗證失敗');
  
      // Refresh verification details
      await handleVerificationSelect(selectedVerification);
      alert("驗證成功！");
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Update page rendering when page changes
  useEffect(() => {
    if (pdfDocument) {
      renderPage(currentPage);
    }
  }, [currentPage, pdfDocument]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pdfDocument) {
        pdfDocument.destroy();
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
  }, [pdfDocument]);
  return (
    <div className="h-screen w-screen flex bg-gray-800 text-white overflow-hidden">
      {/* Left sidebar */}
      <div className="w-52 border-r border-gray-700 flex flex-col overflow-hidden">
        {/* Top navigation */}
        <div className="flex-none flex items-center justify-between p-4 border-b border-gray-700">
          <UserMenu username={username} />
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsRenameDialogOpen(true)}
              className="p-1 hover:bg-gray-700 rounded-full transition-colors"
            >
              <PenSquare className="w-5 h-5" />
            </button>
          </div>
          <RenameDialog
            isOpen={isRenameDialogOpen}
            onClose={() => setIsRenameDialogOpen(false)}
            onSave={handleCreateVerification}
          />
        </div>

        {/* Replace the old message list with VerificationList */}
        <VerificationList onVerificationSelect={handleVerificationSelect} />
      </div>

      {/* Rest of your existing main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Upload area */}
        <div className="flex-1 p-4 flex items-start justify-center gap-4 overflow-hidden">
          {/* Document upload area */}
          <div className="h-full w-1/2 flex flex-col overflow-hidden">
            <div
              className={`flex-1 border-2 border-dashed rounded-lg overflow-hidden transition-colors 
      ${!selectedVerification ? 'opacity-50 cursor-not-allowed border-gray-600' :
                  isDocDragging ? 'border-blue-500 bg-blue-500/10 cursor-pointer' :
                    'border-gray-600 hover:border-gray-500 cursor-pointer'}`}
              onClick={(e) => {
                if (!selectedVerification) {
                  e.preventDefault();
                  return;
                }
                handleContainerClick();
              }}
              onDragEnter={(e) => {
                if (!selectedVerification) {
                  e.preventDefault();
                  return;
                }
                handleDocDragEnter(e);
              }}
              onDragOver={(e) => e.preventDefault()}
              onDragLeave={(e) => {
                if (!selectedVerification) {
                  e.preventDefault();
                  return;
                }
                handleDocDragLeave(e);
              }}
              onDrop={(e) => {
                if (!selectedVerification) {
                  e.preventDefault();
                  return;
                }
                handleDocDrop(e);
              }}
            >
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileChange}
                accept=".docx"
                disabled={!selectedVerification}
              />
              <div className="h-full overflow-auto p-4">
                {!selectedVerification ? (
                  <div className="h-full flex flex-col items-center justify-center gap-4">
                    <Upload className="w-8 h-8 text-gray-400" />
                    <span className="text-gray-400">請先選擇一個驗證</span>
                  </div>
                ) : loading ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
                ) : pdfDocument ? (
                  <div className="h-full flex flex-col items-center relative">
                    <div className="absolute top-2 right-2 z-10">
                      <button
                        onClick={clearPDF}
                        className="p-2 bg-gray-800/80 rounded-full hover:bg-gray-700/80 transition-colors"
                        title="清除文件"
                      >
                        <X className="w-5 h-5 text-gray-300" />
                      </button>
                    </div>
                    <canvas ref={canvasRef} className="max-w-full" />
                    {numPages > 1 && (
                      <div className="mt-4 flex items-center gap-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setCurrentPage(prev => Math.max(1, prev - 1));
                          }}
                          disabled={currentPage <= 1}
                          className="px-4 py-2 bg-gray-700 rounded disabled:opacity-50"
                        >
                          上一頁
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setCurrentPage(prev => Math.min(numPages, prev + 1));
                          }}
                          disabled={currentPage >= numPages}
                          className="px-4 py-2 bg-gray-700 rounded disabled:opacity-50"
                        >
                          下一頁
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center gap-4">
                    <Upload className="w-8 h-8 text-gray-400" />
                    <span className="text-gray-300">
                      {isDocDragging ? "放開以上傳文件" : "拖曳或點擊上傳文件"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Image and results area */}
          <div className="h-full w-1/2 flex flex-col gap-4 overflow-hidden">
            {/* Image upload area */}
            <div
              ref={containerRef}
              className={`h-2/3 border-2 border-dashed rounded-lg overflow-hidden transition-colors
      ${!selectedVerification ? 'opacity-50 cursor-not-allowed border-gray-600' :
                  isImageDragging ? 'border-blue-500 bg-blue-500/10' : 'border-gray-600'}`}
              onContextMenu={(e) => e.preventDefault()}
              onDragEnter={(e) => {
                if (!selectedVerification) {
                  e.preventDefault();
                  return;
                }
                e.preventDefault();
                e.stopPropagation();
                setIsImageDragging(true);
              }}
              onDragOver={(e) => e.preventDefault()}
              onDragLeave={(e) => {
                if (!selectedVerification) {
                  e.preventDefault();
                  return;
                }
                e.preventDefault();
                e.stopPropagation();
                setIsImageDragging(false);
              }}
              onDrop={(e) => {
                if (!selectedVerification) {
                  e.preventDefault();
                  return;
                }
                e.preventDefault();
                e.stopPropagation();
                setIsImageDragging(false);

                const file = e.dataTransfer.files[0];
                if (!file || !file.type.startsWith('image/')) return;

                const reader = new FileReader();
                reader.addEventListener('load', () => {
                  setImgSrc(reader.result?.toString() || '');
                });
                reader.readAsDataURL(file);
              }}
            >
              {!selectedVerification ? (
                <div className="h-full flex flex-col items-center justify-center">
                  <Upload className="w-8 h-8 text-gray-400" />
                  <span className="text-gray-400 mt-2">請先選擇一個驗證</span>
                </div>
              ) : !imgSrc ? (
                <label className="h-full flex flex-col items-center justify-center cursor-pointer hover:bg-gray-700/10">
                  <Upload className="w-8 h-8 text-gray-400" />
                  <span className="text-gray-300 mt-2">
                    {isImageDragging ? "放開以上傳影像" : "拖曳或點擊上傳影像"}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    disabled={!selectedVerification}
                  />
                </label>
              ) : (
                <div className="h-full flex flex-col">
                  <div
                    className="flex-1 overflow-hidden flex items-center justify-center bg-gray-900 relative"
                    ref={containerRef}
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
                        onLoad={onImageLoad}
                        className="max-h-full max-w-full object-contain"
                        draggable={false}
                      />
                    </ReactCrop>
                  </div>
                </div>
              )}
            </div>

            {/* Results area */}
            <div className="w-full h-1/3 border-2 border-gray-600 rounded-lg overflow-auto">
              {selectedVerification ? (
                <VerificationDetails 
                  verificationId={selectedVerification.id} 
                  onDetailsLoaded={(details) => {
                    // Handle the loaded details if needed
                    console.log('Verification details loaded:', details);
                  }}
                />
              ) : (
                <div className="h-full flex flex-col items-center justify-center gap-4">
                  <span className="text-gray-300">選擇一個驗證來查看結果</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-800 border-t border-gray-700">
          <div className="max-w-7xl mx-auto flex flex-col items-center gap-2">
            <button
              onClick={handleVerify}
              disabled={!selectedVerification}
              className={`px-12 py-2 rounded-lg text-white transition-colors ${!selectedVerification
                ? 'bg-gray-600 cursor-not-allowed opacity-50'
                : 'bg-blue-800 hover:bg-blue-500'
                }`}
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