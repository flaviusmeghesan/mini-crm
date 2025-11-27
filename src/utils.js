import { formatDistanceToNow } from 'date-fns';

export const API_URL = 'http://localhost:3001';

export const mapLeadFromDB = (dbLead) => {
    // Generate consistent avatars based on ID
    const leadAvatar = `https://i.pravatar.cc/150?u=${dbLead.id}`;
    // Simple mapping for assigned agent avatars
    const agentAvatars = {
        "Sarah": "https://i.pravatar.cc/150?u=20",
        "Alex": "https://i.pravatar.cc/150?u=21",
        "Jane": "https://i.pravatar.cc/150?u=22",
        "Gav": "https://i.pravatar.cc/150?u=23",
        "Jia": "https://i.pravatar.cc/150?u=24"
    };

    // Determine score icon (simple logic based on tags or score)
    let scoreIcon = null;
    let scoreLabel = "N/A";

    // If tags has "Interested", etc.
    if (dbLead.tags && dbLead.tags.length > 0) {
        // Just take the first one as the "Score" label for now to match UI
        scoreLabel = dbLead.tags[0];
    }

    // Map icon based on label
    if (scoreLabel === "Interested") scoreIcon = "star";
    else if (scoreLabel === "Automations") scoreIcon = "zap";
    else if (scoreLabel === "Achiever") scoreIcon = "award";
    else if (scoreLabel === "Broke") scoreIcon = "dollar-sign";
    else if (scoreLabel === "Explorer") scoreIcon = "search";

    return {
        id: dbLead.id,
        name: dbLead.name,
        avatar: leadAvatar,
        status: dbLead.status,
        score: dbLead.score, // Raw numeric score
        tags: dbLead.tags || [],
        source: dbLead.source,
        dealValue: dbLead.deal_value,
        assignedTo: {
            name: dbLead.assigned_to,
            avatar: agentAvatars[dbLead.assigned_to] || "https://i.pravatar.cc/150?u=99"
        },
        interacted: dbLead.last_interaction ? formatDistanceToNow(new Date(dbLead.last_interaction), { addSuffix: true }) : "Never",
        unreadMessages: 0,
        email: dbLead.email,
        scoreHistory: dbLead.scoreHistory || []
    };
};
