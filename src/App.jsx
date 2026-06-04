import { Routes, Route, Navigate } from "react-router-dom"
import Home from "./pages/Home"
import InitAdmin from "./pages/InitAdmin"
import Login from "./pages/Login"

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/init-admin" element={<InitAdmin />} />
      <Route path="/login" element={<Login />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}
