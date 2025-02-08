import { MoreHorizontal, Upload, User, Search, PenSquare, HelpCircle, X } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import ReactCrop, { centerCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import VerificationList from './components/VerificationList';
import VerificationDetails from './components/VerificationDetails';
import RenameDialog from './components/RenameDialog';
import UserMenu from './components/UserMenu';
import useFileManager from './hooks/useFileManager';

// Import pdf.js directly and set up the worker
import * as pdfjsLib from 'pdfjs-dist';
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';

function centerInitialCrop(mediaWidth, mediaHeight) {
  return centerCrop(
    {
      unit: '%',
      width: 100,
      height: 100,
      x: 0,
      y: 0
    },
    mediaWidth,
    mediaHeight
  );
}

export default function ChatInterface() {



  // File management
  const {
    selectedFiles,
    updateDocumentFile,
    updateImageFile,
    updateImageScope,
    clearFile,
    clearAllFiles,
    loadExistingFiles
  } = useFileManager();

  // Refs
  const fileInputRef = useRef(null);
  const imgRef = useRef(null);
  const canvasRef = useRef(null);
  const navigate = useNavigate();

  // Document states
  const [isPdfAvailable, setIsPdfAvailable] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [pdfDocument, setPdfDocument] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(null);

  // UI states
  const [username, setUsername] = useState("Loading...");
  const [errorMessage, setErrorMessage] = useState("");
  const [showHelp, setShowHelp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loading_button, setLoading_button] = useState(false);
  const [isDocDragging, setIsDocDragging] = useState(false);
  const [isImageDragging, setIsImageDragging] = useState(false);
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);

  // Image states
  const [imgSrc, setImgSrc] = useState('');
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState(null);
  const [selectedVerification, setSelectedVerification] = useState(null);
  const [savedOcrScope, setSavedOcrScope] = useState(null);
  const fetchWithAuth = async (url, options = {}) => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      navigate("/login");
      return;
    }

    // Ensure Authorization header is included
    options.headers = {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    };

    const response = await fetch(url, options);

    if (response.status === 401) {
      localStorage.removeItem("access_token"); // Clear invalid token
      navigate("/login"); // Redirect to login page
      return null;
    }

    return response;
  };

  const handleVerification = async () => {
    if (!selectedVerification) {
      setErrorMessage("請先選擇一個驗證！");
      return;
    }
    if (!selectedFiles.docx && !selectedFiles.image) {
      setErrorMessage("請確保已上傳文件和影像！");
      return;
    }

    setLoading_button(true);
    setErrorMessage("");

    try {
      const formData = new FormData();

      if (selectedFiles.docx) {
        formData.append("docx_file", selectedFiles.docx.file);
      }
      if (selectedFiles.image) {
        formData.append("image_file", selectedFiles.image.file);
      }
      if (selectedFiles.image?.scope) {
        const scope = serializeCropScope(selectedFiles.image.scope);
        formData.append("ocr_scope", scope);
      }

      const response = await fetchWithAuth(
        `http://162.38.2.150:8100/verifications/${selectedVerification.id}/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response) return; // 401 handled inside fetchWithAuth

      if (!response.ok) {
        throw new Error("Failed to upload files");
      }

      const result = await response.json();

      if (result.message === "Verification completed") {
        // Trigger a global event to refresh the verification list
        window.dispatchEvent(new CustomEvent("refreshVerifications"));

        // Fetch the latest verification details
        const detailsResponse = await fetchWithAuth(
          `http://162.38.2.150:8100/verifications/${selectedVerification.id}`
        );

        if (!detailsResponse) return; // 401 handled inside fetchWithAuth

        if (!detailsResponse.ok) {
          throw new Error("Failed to fetch verification details");
        }

        const details = await detailsResponse.json();

        // Force UI update to ensure VerificationDetails re-renders
        setSelectedVerification(null);
        setTimeout(() => {
          setSelectedVerification({
            ...selectedVerification,
            status: details.status,
            details, // Ensure verification results are updated
          });
        }, 100);
      } else if (result.system_component === "docx_processing") {
        setErrorMessage(`文件缺少必要欄位：${result.missing_elements.join(", ")}`);
      } else if (result.system_component === "image_processing") {
        if (result.error_type === "NUTRITION_TABLE_MISSING") {
          setErrorMessage(
            `無法偵測到營養標示表，請確保圖片清晰、光線充足，並包含完整的營養標示內容。`
          );
        }
      }
    } catch (error) {
      console.error("Verification error:", error);
      setErrorMessage("驗證過程發生錯誤，請稍後再試");
    } finally {
      setLoading_button(false);
    }
  };



  // Render PDF page when document or page changes
  useEffect(() => {
    if (pdfDocument && currentPage) {
      renderPage(currentPage);
    }
  }, [pdfDocument, currentPage]);

  // Authentication check
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) navigate('/login');
  }, [navigate]);

  // Load user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetchWithAuth("http://162.38.2.150:8100/users/me");
        if (!response) return; // Already handled 401 redirection

        const userData = await response.json();
        setUsername(userData.username);
      } catch (error) {
        console.error("Error fetching user data:", error);
        setUsername("Error");
      }
    };
    fetchUserData();
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (pdfDocument) pdfDocument.destroy();
      if (imgSrc) URL.revokeObjectURL(imgSrc);
      clearAllFiles();
    };
  }, []);


  // Main handlers
  const handleVerificationSelect = async (verification) => {
    // Clear states if deselecting verification
    if (!verification || (selectedVerification && verification.id !== selectedVerification.id)) {
      clearState();
      clearAllFiles();
    }

    // Update selected verification state
    setSelectedVerification(verification);

    if (!verification) return;

    try {
      // Get the authentication token
      const token = localStorage.getItem('access_token');
      if (!token) throw new Error('No authentication token found');

      // Fetch verification details
      const response = await fetchWithAuth(`http://162.38.2.150:8100/verifications/${verification.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch verification details');
      const data = await response.json();

      // Handle document files (DOCX/PDF)
      if (data.docx_info?.exists || data.pdf_info?.exists) {
        await loadDocumentFiles(verification.id, data, token);
      }

      // Handle image file
      if (data.image_info?.exists) {
        await loadImageFile(verification.id, data.image_info, token);
      }

    } catch (error) {
      console.error("Error fetching verification details:", error);
      setErrorMessage("Failed to load verification data");
    }
  };

  const handleCreateVerification = async (name) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://162.38.2.150:8100/verifications?verification_name=' + encodeURIComponent(name), {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to create verification');

      const newVerification = await response.json();
      setIsRenameDialogOpen(false);

      window.dispatchEvent(new CustomEvent('refreshVerifications'));

      if (newVerification) {
        handleVerificationSelect({
          id: newVerification.id,
          verification_name: newVerification.verification_name,
          status: newVerification.status,
          created_at: newVerification.created_at
        });
      }
    } catch (error) {
      console.error('Error creating verification:', error);
      setErrorMessage('Failed to create verification');
    }
  };

  // Document handlers
  const handleDocxFile = async (file) => {
    setLoading(true);
    setErrorMessage("");

    try {
      updateDocumentFile(file, file.name, 'docx');
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('http://162.38.3.101:8101/doc_to_pdf', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('PDF conversion failed');

      const pdfData = await response.arrayBuffer();
      const pdfBlob = new Blob([pdfData], { type: 'application/pdf' });
      const pdfFile = new File([pdfBlob], 'document.pdf', { type: 'application/pdf' });

      // Update file manager state
      updateDocumentFile(pdfFile, 'document.pdf', 'pdf');

      // Update UI state
      if (pdfDocument) {
        pdfDocument.destroy();
        setPdfDocument(null);
      }

      const loadingTask = pdfjsLib.getDocument({ data: pdfData });
      const pdf = await loadingTask.promise;

      setPdfDocument(pdf);
      setNumPages(pdf.numPages);
      setCurrentPage(1);
      setSelectedFile(file.name);

    } catch (error) {
      console.error('Error converting document:', error);
      setErrorMessage("文件轉換失敗，請稍後再試");
      clearFile('docx');
      clearFile('pdf');
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      handleDocxFile(file);
    } else {
      setErrorMessage("請上傳 DOCX 格式的文件");
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const renderPage = async (pageNum) => {
    if (!pdfDocument || !canvasRef.current) return;

    try {
      const page = await pdfDocument.getPage(pageNum);
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      // Clear previous content
      context.clearRect(0, 0, canvas.width, canvas.height);

      const viewport = page.getViewport({ scale: 1.5 });
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      // Cancel any ongoing rendering task before starting a new one
      if (canvas.renderTask) {
        canvas.renderTask.cancel();
      }

      // Start new rendering task and store reference
      canvas.renderTask = page.render({
        canvasContext: context,
        viewport: viewport
      });

      await canvas.renderTask.promise;
    } catch (error) {
      if (error.name !== 'RenderingCancelledException') {
        console.error('Error rendering PDF page:', error);
        setErrorMessage('PDF 渲染失敗');
      }
    }
  };


  // Image handlers
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    updateImageFile(file, file.name);

    const reader = new FileReader();
    reader.addEventListener('load', () => {
      const imageUrl = reader.result?.toString() || '';
      setImgSrc(imageUrl);

      const img = new Image();
      img.src = imageUrl;
      img.onload = () => {
        const initialCrop = centerInitialCrop(img.width, img.height);
        setCrop(initialCrop);
        setCompletedCrop(null);

        updateImageScope({
          x: initialCrop.x,
          y: initialCrop.y,
          width: initialCrop.width,
          height: initialCrop.height
        });
      };
    });
    reader.readAsDataURL(file);
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
    updateImageScope(newCrop);
  };

  // Helper functions
  const clearState = () => {
    if (pdfDocument) pdfDocument.destroy();
    setPdfDocument(null);
    setNumPages(null);
    setCurrentPage(1);
    setSelectedFile(null);
    setIsPdfAvailable(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (imgSrc) URL.revokeObjectURL(imgSrc);
    setImgSrc('');
    setCompletedCrop(null);
    setCrop(null);
    setSavedOcrScope(null);
    setErrorMessage('');
  };

  const loadDocumentFiles = async (verificationId, data, token) => {
    try {
      // Handle DOCX file first
      console.log('if docx')
      console.log(data.docx_info?.exists)
      if (data.docx_info?.exists) {
        console.log('exdocx')
        const docxResponse = await fetch(
          `http://162.38.2.150:8100/verifications/${verificationId}/docx`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        );

        if (docxResponse.ok) {
          const docxBlob = await docxResponse.blob();
          const docxFile = new File([docxBlob], data.docx_info.filename || 'document.docx', {
            type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          });

          // Update file manager state with DOCX file
          updateDocumentFile(docxFile, data.docx_info.filename, 'docx');
          setSelectedFile(data.docx_info.filename);

          // Only convert to PDF if PDF doesn't exist or isn't available
          if (!data.pdf_info?.exists || !data.pdf_info?.available) {
            await handleDocxFile(docxFile);
            return;
          }
        }
      }

      // Handle existing PDF if available
      if (data.pdf_info?.exists && data.pdf_info?.available) {
        const pdfResponse = await fetch(
          `http://162.38.2.150:8100/verifications/${verificationId}/pdf`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        );

        if (pdfResponse.ok) {
          const pdfData = await pdfResponse.arrayBuffer();

          // Update PDF state for rendering
          const loadingTask = pdfjsLib.getDocument({ data: pdfData });
          const pdf = await loadingTask.promise;
          setPdfDocument(pdf);
          setNumPages(pdf.numPages);
          setCurrentPage(1);
          setIsPdfAvailable(true);

          // Update file manager state with PDF file
          const pdfBlob = new Blob([pdfData], { type: 'application/pdf' });
          const pdfFile = new File([pdfBlob], 'document.pdf', { type: 'application/pdf' });
          updateDocumentFile(pdfFile, 'document.pdf', 'pdf');
        }
      }
    } catch (error) {
      console.error('Error loading document files:', error);
      setErrorMessage('Failed to load document files');
      throw error;
    }
  };
  const loadImageFile = async (verificationId, imageInfo, token) => {
    try {
      const response = await fetch(
        `http://162.38.2.150:8100/verifications/${verificationId}/image`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (response.ok) {
        const imageBlob = await response.blob();
        const imageUrl = URL.createObjectURL(imageBlob);

        // Update UI state
        setImgSrc(imageUrl);

        // Create File object for file manager
        const imageFile = new File([imageBlob], imageInfo.filename || 'image.png', {
          type: imageBlob.type
        });

        // Handle crop scope if exists
        if (imageInfo.ocr_scope) {
          setSavedOcrScope(imageInfo.ocr_scope);
          const scope = parseOcrScope(imageInfo.ocr_scope);
          applyCropFromScope(scope, imageUrl);
          updateImageFile(imageFile, imageInfo.filename, scope);
        } else {
          const img = new Image();
          img.src = imageUrl;
          img.onload = () => {
            const initialCrop = centerInitialCrop(img.width, img.height);
            setCrop(initialCrop);
            updateImageFile(imageFile, imageInfo.filename, {
              cropX: initialCrop.x,
              cropY: initialCrop.y,
              cropWidth: initialCrop.width,
              cropHeight: initialCrop.height
            });
          };
        }
      }
    } catch (error) {
      console.error('Error loading image file:', error);
      throw error;
    }
  };

  // Helper function to parse OCR scope string
  // Helper function to parse OCR scope string
  const parseOcrScope = (scopeStr, imgDimensions) => {
    try {
      // Check if the scope is already in percentage format
      const isPercentageFormat = scopeStr.includes('%');

      const [cropHeight, cropWidth, cropX, cropY] = scopeStr
        .replace(/[\[\]%]/g, '')
        .split(',')
        .map(val => parseFloat(val.trim()));

      // If imgDimensions are provided and it's not in percentage format, convert to percentage
      if (!isPercentageFormat && imgDimensions) {
        return {
          cropX: (cropX / imgDimensions.width) * 100,
          cropY: (cropY / imgDimensions.height) * 100,
          cropWidth: (cropWidth / imgDimensions.width) * 100,
          cropHeight: (cropHeight / imgDimensions.height) * 100
        };
      }

      // If already in percentage or no dimensions provided, return as-is
      return { cropX, cropY, cropWidth, cropHeight };
    } catch (error) {
      console.error('Error parsing OCR scope:', error);
      return null;
    }
  };

  const serializeCropScope = (cropData) => {
    if (!cropData) return null;

    // Extract values, ensuring they exist and are numbers
    const x = parseFloat(cropData.cropX) || 0;
    const y = parseFloat(cropData.cropY) || 0;
    const width = parseFloat(cropData.cropWidth) || 0;
    const height = parseFloat(cropData.cropHeight) || 0;

    // Return in the required format [crop_height, crop_width, crop_x, crop_y]
    return `[${height.toFixed(2)}, ${width.toFixed(2)}, ${x.toFixed(2)}, ${y.toFixed(2)}]`;
  };


  const applyCropFromScope = (scope, imageUrl) => {
    if (!scope) return;

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        // Ensure the crop is in percentage format
        const percentCrop = {
          x: scope.cropX,
          y: scope.cropY,
          width: scope.cropWidth,
          height: scope.cropHeight,
          unit: '%'
        };

        setCrop(percentCrop);
        setCompletedCrop(percentCrop);
        resolve(percentCrop);
      };
      img.onerror = reject;
      img.src = imageUrl;
    });
  };

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

        <VerificationList onVerificationSelect={handleVerificationSelect} />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Upload area */}
        <div className="flex-1 p-4 flex items-start justify-center gap-4 overflow-hidden">
          {/* Document upload area */}
          <div className="h-full w-1/2 flex flex-col overflow-hidden">
            <div
              className={`flex-1 border-2 border-dashed rounded-lg overflow-hidden transition-colors 
        ${!selectedVerification
                  ? 'opacity-50 cursor-not-allowed border-gray-600'
                  : selectedFile || isPdfAvailable  // Modified condition
                    ? 'border-gray-600 cursor-default'  // Changed cursor when file is selected
                    : isDocDragging
                      ? 'border-write-500 bg-blue-500/10 cursor-pointer'
                      : 'border-gray-600 hover:border-gray-500 cursor-pointer'}`}
              onClick={() => {
                // Modified click handler to prevent file selection when a file exists
                if (!selectedVerification || isPdfAvailable || selectedFile) return;
                fileInputRef.current?.click();
              }}
              onDragEnter={(e) => {
                // Modified drag handler to prevent new file drops when a file exists
                if (!selectedVerification || isPdfAvailable || selectedFile) return;
                e.preventDefault();
                e.stopPropagation();
                setIsDocDragging(true);
              }}
              onDragOver={(e) => e.preventDefault()}
              onDragLeave={(e) => {
                if (!selectedVerification || isPdfAvailable || selectedFile) return;
                e.preventDefault();
                e.stopPropagation();
                setIsDocDragging(false);
              }}
              onDrop={(e) => {
                // Modified drop handler to prevent new file drops when a file exists
                if (!selectedVerification || isPdfAvailable || selectedFile) return;
                e.preventDefault();
                e.stopPropagation();
                setIsDocDragging(false);

                const file = e.dataTransfer.files[0];
                if (!file) return;

                if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
                  handleDocxFile(file);
                } else {
                  setErrorMessage("請上傳 DOCX 格式的文件");
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }
              }}
            >
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileChange}
                accept=".docx"
                disabled={!selectedVerification || isPdfAvailable || selectedFile}  // Modified disabled condition
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
                        onClick={(e) => {
                          e.stopPropagation();
                          if (pdfDocument) {
                            pdfDocument.destroy();
                          }
                          setPdfDocument(null);
                          setNumPages(null);
                          setCurrentPage(1);
                          setSelectedFile(null);
                          setIsPdfAvailable(false);
                          clearFile('docx');  // Clear docx file
                          clearFile('pdf');   // Clear pdf file
                          if (fileInputRef.current) {
                            fileInputRef.current.value = '';
                          }
                        }}
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
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage <= 1}
                          className="px-4 py-2 bg-gray-700 rounded disabled:opacity-50"
                        >
                          上一頁
                        </button>
                        <button
                          onClick={() => setCurrentPage(prev => Math.min(numPages, prev + 1))}
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
          <div className="h-full w-1/2 flex flex-col gap-4 overflow-hidden  ">
            {/* Image upload area */}
            <div
              className={`h-full border-2 border-dashed rounded-lg overflow-hidden transition-colors 
                ${!selectedVerification
                  ? 'opacity-50 cursor-not-allowed border-gray-600'
                  : isImageDragging
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-gray-600'}`}
              onDragEnter={(e) => {
                if (!selectedVerification) return;
                e.preventDefault();
                e.stopPropagation();
                setIsImageDragging(true);
              }}
              onDragOver={(e) => e.preventDefault()}
              onDragLeave={(e) => {
                if (!selectedVerification) return;
                e.preventDefault();
                e.stopPropagation();
                setIsImageDragging(false);
              }}
              onDrop={(e) => {
                if (!selectedVerification) return;
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
                  <div className="flex-1 overflow flex items-center p-10  justify-center bg-gray-900 relative">
                    {/* Help and clear buttons container */}
                    <div className="absolute top-2 right-2 z-10 flex gap-2">
                      <button
                        onClick={() => {
                          if (imgSrc) URL.revokeObjectURL(imgSrc);
                          setImgSrc('');
                          clearFile('image');  // Clear image file
                        }}
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
              onClick={handleVerification}
              disabled={!selectedVerification || loading || loading_button}
              className={`px-12 py-2 rounded-lg text-white transition-colors ${!selectedVerification || loading || loading_button
                ? 'bg-gray-600 cursor-not-allowed opacity-50'
                : 'bg-blue-800 hover:bg-blue-500'
                }`}
            >
              {loading_button ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                  處理中...
                </div>
              ) : (
                '驗證'
              )}
            </button>
            {errorMessage && (
              <div className="text-red-500 text-sm whitespace-pre-line">{errorMessage}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}