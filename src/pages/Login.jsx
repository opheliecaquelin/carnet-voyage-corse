import { useState } from "react"
import { supabase } from "../lib/supabase"

export default function Login() {
  const [email, setEmail] = useState("")
  const [msg, setMsg] = useState("")

  const login = async () => {
    const { error } = await supabase.auth.signInWithOtp({ email })
    if (error) return setMsg(error.message)

    setMsg("Check ton email 📩")
  }

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-4">Connexion</h1>

      <input
        className="border p-2 w-full"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="email"
      />

      <button
        onClick={login}
        className="bg-black text-white w-full mt-3 p-2"
      >
        Se connecter
      </button>

      {msg && <p className="mt-3 text-sm">{msg}</p>}
    </div>
  )
}