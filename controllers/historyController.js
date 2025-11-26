const sqlite3 = require('sqlite3').verbose();
const dbPath = process.env.DB_PATH || '/var/lib/scoreboard/scoreboard.db';
const db = new sqlite3.Database(dbPath);

exports.getScoresPage = (req, res) => {
    res.render('scores.hbs');
};

exports.getGamesApi = (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    db.all(
        "SELECT * FROM games ORDER BY startTime DESC LIMIT ? OFFSET ?",
        [limit, offset],
        (err, rows) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }

            // Parse JSON strings back to objects
            const games = rows.map(game => ({
                ...game,
                players: JSON.parse(game.players),
                scores: JSON.parse(game.scores)
            }));

            db.get("SELECT COUNT(*) as count FROM games", (err, row) => {
                if (err) {
                    res.status(500).json({ error: err.message });
                    return;
                }
                res.json({
                    games,
                    totalPages: Math.ceil(row.count / limit),
                    currentPage: page
                });
            });
        }
    );
};

exports.deleteGameApi = (req, res) => {
    const id = req.params.id;
    // Simple check for testing mode, though in a real app this should be more robust
    // The route itself should probably be protected, but checking query param here as a safeguard
    if (!req.query.testing) {
        return res.status(403).json({ error: "Not in testing mode" });
    }

    db.run("DELETE FROM games WHERE id = ?", id, function (err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ message: "Game deleted", changes: this.changes });
    });
};

exports.replayGame = (req, res) => {
    const id = req.body.id;
    if (!id) {
        return res.status(400).json({ error: "Game ID is required" });
    }

    db.get("SELECT * FROM games WHERE id = ?", id, (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!row) {
            return res.status(404).json({ error: "Game not found" });
        }

        let players;
        try {
            players = JSON.parse(row.players);
        } catch (e) {
            return res.status(500).json({ error: "Failed to parse players" });
        }

        const newState = {
            players: players,
            scores: [],
            roundWinner: [],
            started: true,
            startTime: new Date().toISOString()
        };

        const updateGameState = req.app.get('gameStateUpdater');
        if (updateGameState) {
            updateGameState(newState);
            res.json({ message: "Game restarted" });
        } else {
            res.status(500).json({ error: "Game state updater not available" });
        }
    });
};

exports.getRecentPlayers = (req, res) => {
    // Fetch recent games to find unique player sets
    // We'll fetch a reasonable number of recent games to find 3 unique sets
    db.all(
        "SELECT players FROM games ORDER BY startTime DESC LIMIT 20",
        (err, rows) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }

            const uniqueSets = [];
            const seenSets = new Set();

            for (const row of rows) {
                try {
                    // Normalize player set string for comparison
                    // We assume the order matters for "Quick Start" as it might imply seating order
                    // but we should probably treat ["A", "B"] same as ["A", "B"]
                    // The DB stores them as JSON array string.
                    const playersStr = row.players;

                    if (!seenSets.has(playersStr)) {
                        seenSets.add(playersStr);
                        uniqueSets.push(JSON.parse(playersStr));
                    }

                    if (uniqueSets.length >= 3) {
                        break;
                    }
                } catch (e) {
                    console.error("Error parsing players JSON:", e);
                }
            }

            res.json(uniqueSets);
        }
    );
};
