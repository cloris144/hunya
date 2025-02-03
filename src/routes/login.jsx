import React, { useState } from 'react';
function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  // 處理表單提交
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch('http://162.38.3.101:8100/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          username,
          password,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        // 成功獲得認證令牌，保存 token
        localStorage.setItem('access_token', data.access_token);
        // 你可以在這裡處理登入成功的邏輯
        alert('登入成功');
        // 跳轉到首頁或其他頁面
        window.location.href = '/';
      } else {
        // 顯示錯誤訊息
        setError(data.error || '登入失敗');
      }
    } catch (error) {
      setError('發生錯誤，請稍後再試');
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="flex h-screen bg-indigo-700">
      <div className="w-full max-w-xs m-auto bg-indigo-100 rounded p-5">
        <header>
          <img className="w-20 mx-auto mb-5" src="https://img.icons8.com/fluent/344/year-of-tiger.png" alt="logo" />
        </header>
        <form onSubmit={handleSubmit}>
          <div>
            <label className="block mb-2 text-indigo-500" htmlFor="username">Username</label>
            <input
              className="w-full p-2 mb-6 text-indigo-700 border-b-2 border-indigo-500 outline-none focus:bg-gray-300"
              type="text"
              name="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block mb-2 text-indigo-500" htmlFor="password">Password</label>
            <input
              className="w-full p-2 mb-6 text-indigo-700 border-b-2 border-indigo-500 outline-none focus:bg-gray-300"
              type="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div>
            <button
              type="submit"
              className="w-full bg-indigo-700 hover:bg-pink-700 text-white font-bold py-2 px-4 mb-6 rounded"
              disabled={isLoading}
            >
              {isLoading ? '登入中...' : '登入'}
            </button>
          </div>
        </form>
        {error && <div className="text-red-500 text-sm">{error}</div>}
        <footer>
          <a className="text-indigo-700 hover:text-pink-700 text-sm float-left" href="#">Forgot Password?</a>
          <a className="text-indigo-700 hover:text-pink-700 text-sm float-right" href="#">Create Account</a>
        </footer>
      </div>
    </div>
  );
}
export default Login;