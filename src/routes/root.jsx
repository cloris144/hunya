import { MoreHorizontal, Upload, Download, User, Search, PenSquare } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import mammoth from "mammoth"; // 引入 mammoth.js

export default function ChatInterface() {
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(""); // 用來顯示錯誤訊息

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      navigate('/login'); // 如果沒有 token，跳轉到登入頁
    }
  }, [useNavigate]);


  // 觸發文件選擇框
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // 觸發影像選擇框
  const handleImageUploadClick = () => {
    imageInputRef.current?.click();
  };

  // 處理文件變更
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file.name);

      // 只處理 .docx 文件
      if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
        const reader = new FileReader();
        reader.onload = (e) => {
          mammoth
            .convertToHtml({ arrayBuffer: e.target.result })
            .then((result) => {
              setFileContent(result.value); // 轉換為 HTML 並儲存內容
            })
            .catch((err) => console.error("Error converting docx:", err));
        };
        reader.readAsArrayBuffer(file);
      }
    }
  };

  // 處理影像變更
  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target.result); // 儲存影像 URL 以供預覽
      };
      reader.readAsDataURL(file);
    }
  };

  // 處理驗證邏輯
  const handleVerify = () => {
    if (!selectedFile || !selectedImage) {
      setErrorMessage("請確保已上傳文件和影像！");
    } else {
      setErrorMessage(""); // 清除錯誤訊息
      alert("驗證成功！");
    }
  };

  return (
    <div className="flex h-screen bg-gray-800 text-white">
      {/* 左側邊欄 */}
      <div className="w-52 border-r border-gray-700">
        {/* 頂部導航 */}
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

        {/* 訊息列表 */}
        <div className="p-2">
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

      {/* 主內容 */}
      <div className="flex-1 flex flex-col">
        {/* 上傳區域 */}
        <div className="flex-1 p-8 flex items-center justify-center gap-8 h-screen">
          {/* 文件上傳區 */}
          <div className="w-full max-w-2xl h-full border-2 border-dashed border-gray-600 rounded-lg flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-gray-500 transition-colors"
            onClick={handleUploadClick}
          >
            {/* 隱藏的文件輸入框 */}
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileChange}
              accept=".docx"
            />

            {/* 顯示文件預覽區域 */}
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

          {/* 影像上傳區 + 下載按鈕 */}
          <div className="flex-1 flex flex-col gap-8 w-full max-w-2xl h-full">
            {/* 影像上傳區 */}
            <div
              className="w-full max-w-2xl h-2/3 border-2 border-dashed border-gray-600 rounded-lg flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-gray-500 transition-colors"
              onClick={handleImageUploadClick}
            >
              {/* 隱藏的影像輸入框 */}
              <input
                type="file"
                ref={imageInputRef}
                className="hidden"
                onChange={handleImageChange}
                accept="image/*"
              />

              {/* 顯示影像預覽區域 */}
              {selectedImage ? (
                <img
                  src={selectedImage}
                  alt="預覽"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full max-w-2xl h-full flex flex-col items-center justify-center gap-4">
                  <Upload className="w-8 h-8 text-gray-400" />
                  <span className="text-gray-300">上傳影像</span>
                </div>
              )}
            </div>

            {/* 結果區域 */}
            <div className="w-full max-w-2xl h-1/3 border-2 border-gray-600 flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-gray-500 transition-colors rounded-none">
              <span className="text-gray-300">結果</span>
            </div>
          </div>
        </div>

        {/* 驗證按鈕與錯誤訊息 */}
        <div className="p-2 flex flex-col items-center justify-center">
          <button
            onClick={handleVerify}
            className=" max-w-2xl bg-blue-800 hover:bg-blue-500 px-3 py-2 rounded-lg text-white"
          >
            驗證
          </button>
          {errorMessage && (
            <div className="mt-2 text-red-500">{errorMessage}</div>
          )}
        </div>
      </div>
    </div>
  );
}
