import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'; // 引入 Router 和 Routes
import './index.css';
import Root from './routes/root';
import Login from './routes/login';
import reportWebVitals from './reportWebVitals';
import 'react-image-crop/dist/ReactCrop.css';
import ProtectedRoute from "./routes/ProtectedRoute";   
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Router>
      <Routes>
        <Route path="/" element={<Root />} /> {/* 根頁面 */}
        <Route path="/login" element={<Login />} /> {/* 登入頁面 */}
      </Routes>
    </Router>
  </React.StrictMode>
);

// 如果你想要開始測量應用程式的性能，可以傳入一個函數來記錄結果
// 例如：reportWebVitals(console.log) 或將其發送到分析端點。
// 想了解更多： https://bit.ly/CRA-vitals
reportWebVitals();
