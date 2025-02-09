import { useState, useEffect, useRef } from "react"
import ModelViewer from "@metamask/logo"

function Login() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const containerRef = useRef(null)
  const viewerRef = useRef(null)

  useEffect(() => {
    if (containerRef.current) {
      // Clear any existing child elements before appending
      containerRef.current.innerHTML = "";
  
      viewerRef.current = ModelViewer({
        pxNotRatio: true,
        width: 200,
        height: 200,
        followMouse: true,
        slowDrift: true,
      });
  
      containerRef.current.appendChild(viewerRef.current.container);
    }
  
    return () => {
      if (viewerRef.current) {
        viewerRef.current.stopAnimation();
        viewerRef.current = null;
      }
    };
  }, []);
  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          username,
          password,
        }),
      })
      const data = await response.json()
      if (response.ok) {
        localStorage.setItem("access_token", data.access_token)
        alert("登入成功")
        window.location.href = "/"
      } else {
        setError(data.error || "登入失敗")
      }
    } catch (error) {
      setError("發生錯誤，請稍後再試")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex h-screen bg-indigo-700">
      <div className="w-full max-w-md m-auto bg-indigo-100 rounded p-5">
        <header className="mb-5">
          <div ref={containerRef} className="w-48 h-48 mx-auto" />
        </header>
        <form onSubmit={handleSubmit}>
          <div>
            <label className="block mb-2 text-indigo-500" htmlFor="username">
              Username
            </label>
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
            <label className="block mb-2 text-indigo-500" htmlFor="password">
              Password
            </label>
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
              {isLoading ? "登入中..." : "登入"}
            </button>
          </div>
        </form>
        {error && <div className="text-red-500 text-sm">{error}</div>}
      </div>
    </div>
  )
}

export default Login