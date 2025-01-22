import { MoreHorizontal, Upload, Download, User, Search, PenSquare } from "lucide-react"
import React from 'react';
export default function ChatInterface() {
  return (
    <div className="flex h-screen bg-gray-800 text-white">
      {/* Left sidebar */}
      <div className="w-52 border-r border-gray-700">
        {/* Top nav */}
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

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Upload area */}
        <div className="flex-1 p-8 flex items-center justify-center gap-8">
          {/* File upload */}
          <div className="w-full max-w-2xl h-full border-2 border-dashed border-gray-600 rounded-lg flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-gray-500 transition-colors">
            <div className=" rounded-lg flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-gray-500 transition-colors">
              <Upload className="w-8 h-8 text-gray-400" />
              <span className="text-gray-300">上傳文件</span>
            </div>
          </div>
          <div className="flex-1 flex flex-col gap-8 h-full">
          <div className="w-full max-w-2xl h-2/3 border-2 border-dashed border-gray-600 rounded-t-lg flex flex-col items-center gap-4 cursor-pointer hover:border-gray-500 transition-colors ">
            <div className="flex flex-col items-center justify-center  gap-4 flex-grow">
              <Upload className="w-8 h-8 text-gray-400" />
              <span className="text-gray-300">上傳影像</span>
            </div>
            <button className="w-1/3 bg-gray-700 hover:bg-gray-600 px-4 py-2 transition-colors flex items-center justify-center mt-auto">
              <Download className="w-5 h-5 mr-2" />
              <span>輸出</span>
            </button>
          </div>

        <div className="w-full max-w-2xl h-1/3 border-2 border-gray-600 flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-gray-500 transition-colors rounded-none">
          <span className="text-gray-300">結果</span>
        </div>
      </div>

        </div>

        
      </div>
    </div>
  )
}

