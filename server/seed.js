const db = require('./database');

const leads = [
    {
        name: "Sarah Parker",
        email: "sarah.parker@example.com",
        status: "Won",
        score: 85,
        tags: JSON.stringify(["Interested", "Automations"]),
        source: "Sponsored Ad",
        last_interaction: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        assigned_to: "Sarah",
        deal_value: 2500.00
    },
    {
        name: "Mike Brown",
        email: "mike.brown@example.com",
        status: "Call Booked",
        score: 60,
        tags: JSON.stringify(["Interested"]),
        source: "Sponsored Ad",
        last_interaction: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
        assigned_to: "Alex",
        deal_value: null
    },
    {
        name: "Linda Chen",
        email: "linda.chen@example.com",
        status: "Unqualified",
        score: 20,
        tags: JSON.stringify([]),
        source: "Sponsored Ad",
        last_interaction: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week ago
        assigned_to: "Jane",
        deal_value: null
    },
    {
        name: "David Lee",
        email: "david.lee@example.com",
        status: "Won",
        score: 90,
        tags: JSON.stringify(["Interested"]),
        source: "Direct Message",
        last_interaction: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days ago
        assigned_to: "Gav",
        deal_value: 5000.00
    },
    {
        name: "Emily White",
        email: "emily.white@example.com",
        status: "No Show",
        score: 0,
        tags: JSON.stringify([]),
        source: "Story - Replies",
        last_interaction: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 mins ago
        assigned_to: "Jia",
        deal_value: null
    },
    {
        name: "Kevin Harris",
        email: "kevin.harris@example.com",
        status: "Qualified",
        score: 75,
        tags: JSON.stringify(["Automations"]),
        source: "Direct Message",
        last_interaction: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        assigned_to: "Jane",
        deal_value: null
    }
];

const messages = [
    { lead_id: 1, sender: "lead", message: "Hi, I saw your ad about automations.", timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
    { lead_id: 1, sender: "user", message: "Hey Sarah! Yes, we help businesses streamline their workflows. What specifically are you looking to automate?", timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 1000 * 60).toISOString() },
    { lead_id: 2, sender: "lead", message: "Can we book a call?", timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString() },
    { lead_id: 2, sender: "user", message: "Sure, here is my calendar link.", timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000 + 1000 * 60).toISOString() }
];

db.serialize(() => {
    // Clear existing data
    db.run("DELETE FROM leads");
    db.run("DELETE FROM messages");
    db.run("DELETE FROM sqlite_sequence WHERE name='leads' OR name='messages'");

    const stmt = db.prepare("INSERT INTO leads (name, email, status, score, tags, source, last_interaction, assigned_to, deal_value) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");

    leads.forEach(lead => {
        stmt.run(lead.name, lead.email, lead.status, lead.score, lead.tags, lead.source, lead.last_interaction, lead.assigned_to, lead.deal_value);
    });

    stmt.finalize();

    const msgStmt = db.prepare("INSERT INTO messages (lead_id, sender, message, timestamp) VALUES (?, ?, ?, ?)");
    messages.forEach(msg => {
        msgStmt.run(msg.lead_id, msg.sender, msg.message, msg.timestamp);
    });
    msgStmt.finalize();

    console.log("Database seeded successfully!");
});

db.close();
