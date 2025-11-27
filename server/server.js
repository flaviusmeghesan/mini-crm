const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const db = require('./database');
const { Parser } = require('json2csv');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(bodyParser.json());

// --- LEADS ROUTES ---

// GET /leads - Get all leads
app.get('/leads', (req, res) => {
    const sql = "SELECT * FROM leads ORDER BY last_interaction DESC";
    db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        // Parse tags from JSON string
        const leads = rows.map(row => ({
            ...row,
            tags: JSON.parse(row.tags || '[]')
        }));
        res.json({
            "message": "success",
            "data": leads
        });
    });
});

// GET /leads/:id - Get specific lead
app.get('/leads/:id', (req, res) => {
    const id = req.params.id;
    db.get("SELECT * FROM leads WHERE id = ?", [id], (err, row) => {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        if (!row) {
            res.status(404).json({ error: "Lead not found" });
            return;
        }

        // Parse tags
        try {
            row.tags = JSON.parse(row.tags);
        } catch (e) {
            row.tags = [];
        }

        // Fetch score history
        db.all("SELECT * FROM score_history WHERE lead_id = ? ORDER BY timestamp DESC", [id], (err, history) => {
            if (err) {
                // If history fetch fails, return lead without history rather than erroring out
                console.error("Failed to fetch score history", err);
                res.json({ ...row, scoreHistory: [] });
            } else {
                res.json({ ...row, scoreHistory: history });
            }
        });
    });
});

// POST /leads - Create a new lead
app.post('/leads', (req, res) => {
    const { name, email, status, score, tags, source, assigned_to, deal_value } = req.body;
    const sql = `INSERT INTO leads (name, email, status, score, tags, source, last_interaction, assigned_to, deal_value) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const timestamp = new Date().toISOString();
    const tagsStr = JSON.stringify(tags || []);

    const params = [name, email, status || 'New Lead', score || 0, tagsStr, source, timestamp, assigned_to, deal_value];

    db.run(sql, params, function (err) {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        const leadId = this.lastID;

        // Record initial score history if score is provided and greater than 0
        if (score !== undefined && score > 0) {
            db.run(
                `INSERT INTO score_history (lead_id, change, reason) VALUES (?, ?, ?)`,
                [leadId, score, 'Initial Score'],
                (scoreErr) => {
                    if (scoreErr) {
                        console.error("Failed to insert initial score history:", scoreErr.message);
                    }
                }
            );
        }

        res.json({
            "message": "success",
            "data": { id: leadId, ...req.body },
            "id": leadId
        });
    });
});

// PUT /leads/:id - Update lead
app.put('/leads/:id', (req, res) => {
    // 1. EXTRAGEM ID-UL (Asta lipsea sau era pusă greșit înainte)
    const { id } = req.params;

    // 2. Extragem datele primite din n8n
    const { name, email, status, score, tags, source, assigned_to, deal_value, last_interaction } = req.body;

    console.log(`Updating lead ID: ${id} with status: ${status}, score: ${score}`); // Log pentru debug

    // 3. Construim query-ul dinamic
    let updateFields = [];
    let params = [];

    if (name) { updateFields.push("name = ?"); params.push(name); }
    if (email) { updateFields.push("email = ?"); params.push(email); }
    if (status) { updateFields.push("status = ?"); params.push(status); }
    if (score !== undefined) { updateFields.push("score = ?"); params.push(score); }
    if (tags) { updateFields.push("tags = ?"); params.push(JSON.stringify(tags)); }
    if (source) { updateFields.push("source = ?"); params.push(source); }
    if (assigned_to) { updateFields.push("assigned_to = ?"); params.push(assigned_to); }
    if (deal_value !== undefined) { updateFields.push("deal_value = ?"); params.push(deal_value); }

    // IMPORTANT: Aici preluăm data trimisă de n8n
    if (last_interaction) { updateFields.push("last_interaction = ?"); params.push(last_interaction); }

    if (updateFields.length === 0) {
        return res.status(400).json({ "error": "No fields to update" });
    }

    // 4. Executăm update-ul cu logica de istoric scor
    const performUpdate = () => {
        const sql = `UPDATE leads SET ${updateFields.join(", ")} WHERE id = ?`;
        params.push(id);

        db.run(sql, params, function (err) {
            if (err) {
                console.error("SQL Error:", err.message);
                return res.status(400).json({ error: err.message });
            }

            res.json({
                message: "success",
                changes: this.changes,
                updated_id: id
            });
        });
    };

    // Dacă se modifică scorul, înregistrăm în istoric
    if (score !== undefined) {
        db.get("SELECT score FROM leads WHERE id = ?", [id], (err, row) => {
            if (!err && row) {
                const oldScore = row.score || 0;
                const newScore = score;
                const change = newScore - oldScore;

                if (change !== 0) {
                    db.run(
                        `INSERT INTO score_history (lead_id, change, reason) VALUES (?, ?, ?)`,
                        [id, change, 'Manual Update'],
                        (histErr) => {
                            if (histErr) console.error("History Insert Error:", histErr);
                            performUpdate();
                        }
                    );
                } else {
                    performUpdate();
                }
            } else {
                performUpdate();
            }
        });
    } else {
        performUpdate();
    }
});

// DELETE /leads/:id - Delete lead
app.delete('/leads/:id', (req, res) => {
    db.run("DELETE FROM leads WHERE id = ?", req.params.id, function (err) {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json({ "message": "deleted", changes: this.changes });
    });
});

// --- MESSAGES ROUTES ---

// GET /messages/:leadId - Get conversation history
app.get('/messages/:leadId', (req, res) => {
    const sql = "SELECT * FROM messages WHERE lead_id = ? ORDER BY timestamp ASC";
    db.all(sql, [req.params.leadId], (err, rows) => {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json({
            "message": "success",
            "data": rows
        });
    });
});

// POST /messages - Save message and update lead last_interaction
app.post('/messages', (req, res) => {
    const { lead_id, sender, message } = req.body;
    const timestamp = new Date().toISOString();

    const sqlMsg = "INSERT INTO messages (lead_id, sender, message, timestamp) VALUES (?, ?, ?, ?)";
    const sqlLead = "UPDATE leads SET last_interaction = ? WHERE id = ?";

    db.serialize(() => {
        db.run(sqlMsg, [lead_id, sender, message, timestamp], function (err) {
            if (err) {
                res.status(400).json({ "error": err.message });
                return;
            }

            // Update lead interaction time
            db.run(sqlLead, [timestamp, lead_id], function (err) {
                if (err) {
                    console.error("Failed to update lead interaction time", err);
                }
            });

            res.json({
                "message": "success",
                "data": { id: this.lastID, lead_id, sender, message, timestamp }
            });
        });
    });
});

// --- EXPORT ROUTE ---

// GET /export - Export leads as CSV
app.get('/export', (req, res) => {
    const sql = "SELECT * FROM leads";
    db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }

        try {
            const fields = ['id', 'name', 'email', 'status', 'score', 'tags', 'source', 'last_interaction'];
            const opts = { fields };
            const parser = new Parser(opts);
            const csv = parser.parse(rows);

            res.header('Content-Type', 'text/csv');
            res.attachment('leads.csv');
            return res.send(csv);
        } catch (err) {
            res.status(500).json({ "error": err.message });
        }
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
