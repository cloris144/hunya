import React from "react";
import { Navigate } from "react-router-dom";

// 路由守卫
const ProtectedRoute = ({ children }) => {
  const authToken = localStorage.getItem("token"); // 假设token存储在localStorage中
  if (!authToken) {
    // 如果没有token，重定向到登录页
    return <Navigate to="/login" replace />;
  }
  return children; // 如果有token，渲染目标组件
};

export default ProtectedRoute;
