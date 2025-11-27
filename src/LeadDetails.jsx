import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API_URL, mapLeadFromDB } from './utils';
import { ArrowLeft, Mail, Phone, Calendar, Clock, Star, Zap, Award, DollarSign, Search, Send, MoreHorizontal, TrendingUp } from 'lucide-react';

const ScoreTag = ({ label, icon }) => {
    const icons = {
        star: Star,
        zap: Zap,
        award: Award,
        "dollar-sign": DollarSign,
        search: Search
    };
    const Icon = icons[icon] || Star;

    return (
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-medium w-fit">
            <Icon size={14} />
            {label}
        </div>
    );
};

export default function LeadDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [lead, setLead] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        // Fetch lead details
        fetch(`${API_URL}/leads/${id}`)
            .then(res => res.json())
            .then(data => {
                if (data && data.id) {
                    setLead(mapLeadFromDB(data));
                } else if (data.error) {
                    console.error("API Error:", data.error);
                }
            })
            .catch(err => console.error("Error fetching lead:", err));

        // Fetch messages
        fetch(`${API_URL}/messages/${id}`)
            .then(res => res.json())
            .then(data => {
                setMessages(data.data || []);
                setIsLoading(false);
            })
            .catch(err => {
                console.error("Error fetching messages:", err);
                setIsLoading(false);
            });
    }, [id]);

    const handleSendMessage = () => {
        if (!newMessage.trim()) return;

        const payload = {
            lead_id: id,
            sender: 'user',
            message: newMessage
        };

        fetch(`${API_URL}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
            .then(res => res.json())
            .then(data => {
                if (data.data) {
                    setMessages([...messages, data.data]);
                    setNewMessage("");
                }
            })
            .catch(err => console.error("Error sending message:", err));
    };

    if (isLoading) {
        return <div className="p-8 flex items-center justify-center">Loading...</div>;
    }

    if (!lead) {
        return <div className="p-8">Lead not found</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <button
                onClick={() => navigate('/')}
                className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 transition-colors"
            >
                <ArrowLeft size={18} />
                Back to Leads
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
                {/* Left Column: Info */}
                <div className="space-y-6">
                    {/* Profile Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-start justify-between mb-6">
                            <div className="flex items-center gap-4">
                                <img src={lead.avatar} alt="" className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm" />
                                <div>
                                    <h1 className="text-xl font-bold text-gray-900">{lead.name}</h1>
                                    <p className="text-gray-500 text-sm">{lead.email}</p>
                                </div>
                            </div>
                            <button className="p-2 hover:bg-gray-50 rounded-lg text-gray-400">
                                <MoreHorizontal size={20} />
                            </button>
                        </div>

                        <div className="space-y-4 pt-6 border-t border-gray-100">
                            <div>
                                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1 block">Status</label>
                                <div className="inline-block px-3 py-1 bg-gray-100 rounded-full text-sm font-medium text-gray-900">
                                    {lead.status}
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1 block">Score</label>
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-1 px-3 py-1.5 bg-yellow-50 text-yellow-700 rounded-full text-sm font-medium w-fit">
                                        <Star size={14} className="fill-yellow-500 text-yellow-500" />
                                        {lead.score}
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1 block">Tags</label>
                                <div className="flex flex-wrap gap-2">
                                    {lead.tags && lead.tags.length > 0 ? (
                                        lead.tags.map(tag => (
                                            <span key={tag} className="px-2 py-1 bg-gray-100 rounded-md text-xs text-gray-600 flex items-center gap-1">
                                                <Zap size={10} className="text-blue-400" />
                                                {tag}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-sm text-gray-400">No tags</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Score History */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="font-semibold text-gray-900 mb-4">Score History</h3>
                        <div className="space-y-4">
                            {lead.scoreHistory && lead.scoreHistory.length > 0 ? (
                                lead.scoreHistory.map((history, idx) => (
                                    <div key={idx} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${history.change > 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                                <TrendingUp size={16} className={history.change < 0 ? "rotate-180" : ""} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">{history.change > 0 ? 'Score increased' : 'Score decreased'}</p>
                                                <p className="text-xs text-gray-500">{history.reason}</p>
                                            </div>
                                        </div>
                                        <span className={`text-sm font-bold ${history.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {history.change > 0 ? '+' : ''}{history.change}
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center text-gray-400 text-sm py-4">No score history available</div>
                            )}
                        </div>
                    </div>

                    {/* Activity Log (Simulated) */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="font-semibold text-gray-900 mb-4">Activity Log</h3>
                        <div className="space-y-6 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100">
                            <div className="relative pl-8">
                                <div className="absolute left-0 top-1 w-4 h-4 rounded-full bg-blue-100 border-2 border-white ring-1 ring-blue-500" />
                                <p className="text-sm text-gray-900">Last interaction via <span className="font-medium">{lead.source || 'Unknown'}</span></p>
                                <p className="text-xs text-gray-400 mt-1">{lead.interacted}</p>
                            </div>
                            <div className="relative pl-8">
                                <div className="absolute left-0 top-1 w-4 h-4 rounded-full bg-gray-200 border-2 border-white" />
                                <p className="text-sm text-gray-900">Lead status updated to <span className="font-medium">{lead.status}</span></p>
                                <p className="text-xs text-gray-400 mt-1">Recently</p>
                            </div>
                            <div className="relative pl-8">
                                <div className="absolute left-0 top-1 w-4 h-4 rounded-full bg-gray-200 border-2 border-white" />
                                <p className="text-sm text-gray-900">Lead created</p>
                                <p className="text-xs text-gray-400 mt-1">1 week ago</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Timeline / Inbox */}
                <div className="lg:col-span-2 flex flex-col h-[600px] bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                        <h3 className="font-semibold text-gray-900">Interaction History</h3>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/30">
                        {messages.length === 0 && (
                            <div className="text-center text-gray-400 text-sm py-10">No messages yet</div>
                        )}
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex gap-4 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                                <img
                                    src={msg.sender === 'user' ? lead.assignedTo.avatar : lead.avatar}
                                    alt=""
                                    className="w-8 h-8 rounded-full mt-1"
                                />
                                <div className="flex-1">
                                    <div className={`p-4 rounded-2xl shadow-sm ${msg.sender === 'user'
                                        ? 'bg-blue-600 text-white rounded-tr-none ml-auto'
                                        : 'bg-white border border-gray-200 rounded-tl-none'
                                        }`}>
                                        <p className={`text-sm ${msg.sender === 'user' ? 'text-white' : 'text-gray-800'}`}>
                                            {msg.message}
                                        </p>
                                    </div>
                                    <p className={`text-xs text-gray-400 mt-2 ${msg.sender === 'user' ? 'mr-2 text-right' : 'ml-2'}`}>
                                        {new Date(msg.timestamp).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
