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

app.get("/api/team-form/:teamId", async (req, res) => {
  const token = process.env.FOOTBALL_DATA_TOKEN;
  const teamId = Number(req.params.teamId);

  if (!token) {
    return res.status(503).json({
      ok: false,
      message: "Football API token is not configured."
    });
  }

  if (!Number.isInteger(teamId) || teamId <= 0) {
    return res.status(400).json({
      ok: false,
      message: "Invalid team ID."
    });
  }

  try {
    const url =
      "https://api.football-data.org/v4/teams/" +
      teamId +
      "/matches?status=FINISHED&limit=10";

    const response = await fetch(url, {
      headers: {
        "X-Auth-Token": token
      }
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        ok: false,
        message: data.message || "Unable to retrieve team history."
      });
    }

    const matches = (data.matches || []).map(match => {
      const isHome = match.homeTeam.id === teamId;

      const goalsFor = isHome
        ? match.score.fullTime.home
        : match.score.fullTime.away;

      const goalsAgainst = isHome
        ? match.score.fullTime.away
        : match.score.fullTime.home;

      let result = "UNKNOWN";

      if (Number.isFinite(goalsFor) &&
          Number.isFinite(goalsAgainst)) {
        if (goalsFor > goalsAgainst) result = "WIN";
        else if (goalsFor < goalsAgainst) result = "LOSS";
        else result = "DRAW";
      }

      return {
        date: match.utcDate,
        competition: match.competition?.name || "Unknown",
        opponent: isHome
          ? match.awayTeam.name
          : match.homeTeam.name,
        venue: isHome ? "HOME" : "AWAY",
        goalsFor,
        goalsAgainst,
        result
      };
    });

    const validMatches = matches.filter(match =>
      Number.isFinite(match.goalsFor) &&
      Number.isFinite(match.goalsAgainst)
    );

    const wins = validMatches.filter(m => m.result === "WIN").length;
    const draws = validMatches.filter(m => m.result === "DRAW").length;
    const losses = validMatches.filter(m => m.result === "LOSS").length;

    const goalsFor = validMatches.reduce(
      (sum, match) => sum + match.goalsFor, 0
    );

    const goalsAgainst = validMatches.reduce(
      (sum, match) => sum + match.goalsAgainst, 0
    );

    res.json({
      ok: true,
      teamId,
      matches,
      summary: {
        matchesPlayed: validMatches.length,
        wins,
        draws,
        losses,
        averageGoalsScored: validMatches.length
          ? Number((goalsFor / validMatches.length).toFixed(2))
          : null,
        averageGoalsConceded: validMatches.length
          ? Number((goalsAgainst / validMatches.length).toFixed(2))
          : null
      }
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
