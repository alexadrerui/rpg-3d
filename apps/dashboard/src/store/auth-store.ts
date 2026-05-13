import { create }   from "zustand"
import { persist }  from "zustand/middleware"
import { setApiToken } from "../lib/api-client"

type AuthStore = {
  token:   string | null
  userId:  string
  name:    string
  email:   string
  setAuth: (data: { token: string; userId: string; name: string; email: string }) => void
  clear:   () => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      token:  null,
      userId: "",
      name:   "",
      email:  "",

      setAuth: (data) => {
        setApiToken(data.token)
        set(data)
      },

      clear: () => {
        setApiToken(null)
        set({ token: null, userId: "", name: "", email: "" })
      },
    }),
    { name: "rpg3d-dashboard-auth" }
  )
)
