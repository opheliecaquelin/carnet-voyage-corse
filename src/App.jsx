import { Routes, Route, Navigate } from "react-router-dom"
import Home from "./pages/Home"
import InitAdmin from "./pages/InitAdmin"


export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/admin" element={<InitAdmin />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}
