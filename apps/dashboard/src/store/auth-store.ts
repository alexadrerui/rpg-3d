import { create }   from "zustand"
import { persist }  from "zustand/middleware"
import { setApiToken, setRefreshToken } from "../lib/api-client"

type AuthStore = {
  token:   string | null
  userId:  string
  name:    string
  email:   string
  setAuth: (data: { token: string; refreshToken?: string; userId: string; name: string; email: string }) => void
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
        if (data.refreshToken) setRefreshToken(data.refreshToken)
        set({ token: data.token, userId: data.userId, name: data.name, email: data.email })
      },

      clear: () => {
        setApiToken(null)
        setRefreshToken(null)
        set({ token: null, userId: "", name: "", email: "" })
      },
    }),
    { name: "rpg3d-dashboard-auth" }
  )
)
