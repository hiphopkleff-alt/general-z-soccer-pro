const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(__dirname));

app.get("/api/health", (req, res) => {
res.json({
ok: true,
app: "GENERAL Z-SOCCER PRO V1.0",
message: "Backend is running"
});
});

app.get("/api/fixtures", async (req, res) => {
const token = process.env.FOOTBALL_DATA_TOKEN;

if (!token) {
return res.status(503).json({
ok: false,
message: "Football API token is not configured in Render."
});
}

try {
const response = await fetch(
"https://api.football-data.org/v4/matches",
{
headers: {
"X-Auth-Token": token
}
}
);

const data = await response.json();

if (!response.ok) {
  return res.status(response.status).json({
    ok: false,
    message: data.message || "Football API request failed."
  });
}

res.json({
  ok: true,
  matches: data.matches || []
});

} catch (error) {
res.status(500).json({
ok: false,
message: "Unable to connect to the football data provider."
});
}
});

app.get("*", (req, res) => {
res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
console.log("GENERAL Z-SOCCER PRO running on port ${PORT}");
});
