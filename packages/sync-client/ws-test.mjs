import { io } from "socket.io-client"

const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbXJiNnBkbTgwMDAwMnVyb2hiYTdwdDZzIiwibmFtZSI6Ik1lc3RyZSBUZXN0ZSIsImVtYWlsIjoibWVzdHJlQHRlc3RlLmNvbSIsImlhdCI6MTc4MzQ2MTEyMiwiZXhwIjoxNzg0MDY1OTIyfQ.vo-ZLK6Y5g3i4hqaDccKqejH2MRZARA7UCMMSlGQp3g"

const s = io("http://localhost:4001", { auth: { token: TOKEN }, transports: ["websocket"] })
s.on("connect_error", (e) => { console.log("connect_error:", e.message); process.exit(1) })
s.on("error", (e) => console.log("server error event:", JSON.stringify(e)))
s.on("connect", () => {
  console.log("connected, sid =", s.id)
  s.emit("room:join", {
    sessionId: "cmrb6qv9l00082uroquwcu3gn",
    campaignId: "cmrb6prid00042urob6isgbbp",
    token: TOKEN,
  }, (res) => { console.log("room:join ack:", JSON.stringify(res)); process.exit(res.ok ? 0 : 1) })
})
setTimeout(() => { console.log("timeout"); process.exit(2) }, 8000)
