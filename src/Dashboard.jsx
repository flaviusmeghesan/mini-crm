import React, { useState, useMemo, useEffect } from 'react';
import LeadsTable from './components/LeadsTable';
import { leadStatuses, scoreTags } from './mockData';
import { API_URL, mapLeadFromDB } from './utils';
import { Search, Filter, Calendar, Users, ChevronDown, Download, Plus, LayoutGrid, List, UserPlus, X, Zap, Star } from 'lucide-react';

export default function Dashboard() {
    const [leads, setLeads] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedLeads, setSelectedLeads] = useState([]);

    // Filters
    const [statusFilter, setStatusFilter] = useState("Any Status");
    const [tagFilter, setTagFilter] = useState("Any Tag");
    const [scoreRange, setScoreRange] = useState("All Scores");

    // Fetch leads from API
    useEffect(() => {
        fetch(`${API_URL}/leads`)
            .then(res => res.json())
            .then(data => {
                const mappedLeads = data.data.map(mapLeadFromDB);
                setLeads(mappedLeads);
                setIsLoading(false);
            })
            .catch(err => {
                console.error("Error fetching leads:", err);
                setIsLoading(false);
            });
    }, []);

    const filteredLeads = useMemo(() => {
        return leads.filter(lead => {
            const query = searchQuery.toLowerCase();
            const matchesSearch =
                lead.name.toLowerCase().includes(query) ||
                lead.email.toLowerCase().includes(query) ||
                (lead.source && lead.source.toLowerCase().includes(query)) ||
                (lead.tags && lead.tags.some(tag => tag.toLowerCase().includes(query)));

            const matchesStatus = statusFilter === "Any Status" || lead.status === statusFilter;

            const matchesTag = tagFilter === "Any Tag" || (lead.tags && lead.tags.includes(tagFilter));

            let matchesScore = true;
            if (scoreRange === "> 50") matchesScore = lead.score > 50;
            if (scoreRange === "> 80") matchesScore = lead.score > 80;
            if (scoreRange === "< 50") matchesScore = lead.score < 50;

            return matchesSearch && matchesStatus && matchesTag && matchesScore;
        });
    }, [leads, searchQuery, statusFilter, tagFilter, scoreRange]);

    const handleToggleSelect = (id) => {
        if (id === 'all') {
            if (selectedLeads.length === filteredLeads.length) {
                setSelectedLeads([]);
            } else {
                setSelectedLeads(filteredLeads.map(l => l.id));
            }
        } else {
            if (selectedLeads.includes(id)) {
                setSelectedLeads(selectedLeads.filter(l => l !== id));
            } else {
                setSelectedLeads([...selectedLeads, id]);
            }
        }
    };

    const handleUpdateStatus = (id, newStatus) => {
        // Optimistic update
        const originalLeads = [...leads];
        setLeads(leads.map(lead =>
            lead.id === id ? { ...lead, status: newStatus } : lead
        ));

        fetch(`${API_URL}/leads/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        }).catch(err => {
            console.error("Failed to update status", err);
            setLeads(originalLeads); // Revert on error
        });
    };

    const handleUpdateTags = (id, tagLabel) => {
        const lead = leads.find(l => l.id === id);
        const currentTags = lead.tags || [];
        let newTags;

        if (currentTags.includes(tagLabel)) {
            newTags = currentTags.filter(t => t !== tagLabel);
        } else {
            newTags = [...currentTags, tagLabel];
        }

        // Optimistic update
        const originalLeads = [...leads];
        setLeads(leads.map(l =>
            l.id === id ? { ...l, tags: newTags } : l
        ));

        fetch(`${API_URL}/leads/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tags: newTags })
        }).catch(err => {
            console.error("Failed to update tags", err);
            setLeads(originalLeads);
        });
    };

    const [bulkActionOpen, setBulkActionOpen] = useState(null); // 'status' | 'tag' | null

    const handleBulkStatusChange = (newStatus) => {
        // Optimistic update
        const originalLeads = [...leads];
        setLeads(leads.map(lead =>
            selectedLeads.includes(lead.id) ? { ...lead, status: newStatus } : lead
        ));

        // API calls
        Promise.all(selectedLeads.map(id =>
            fetch(`${API_URL}/leads/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            })
        )).catch(err => {
            console.error("Bulk status update failed", err);
            setLeads(originalLeads);
        });

        setBulkActionOpen(null);
        setSelectedLeads([]);
    };

    const handleBulkTagAdd = (tagLabel) => {
        // Optimistic update
        const originalLeads = [...leads];
        setLeads(leads.map(lead => {
            if (selectedLeads.includes(lead.id)) {
                const currentTags = lead.tags || [];
                if (!currentTags.includes(tagLabel)) {
                    return { ...lead, tags: [...currentTags, tagLabel] };
                }
            }
            return lead;
        }));

        // API calls
        // We need to fetch current tags for each lead to append correctly on server if we were doing it strictly RESTful, 
        // but since we have the state locally, we can use that for the payload.
        // However, `leads` state might be slightly stale if other updates happened. 
        // For this demo, using local state to determine new tags is acceptable.

        Promise.all(selectedLeads.map(id => {
            const lead = leads.find(l => l.id === id);
            const currentTags = lead.tags || [];
            const newTags = currentTags.includes(tagLabel) ? currentTags : [...currentTags, tagLabel];

            return fetch(`${API_URL}/leads/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tags: newTags })
            });
        })).catch(err => {
            console.error("Bulk tag update failed", err);
            setLeads(originalLeads);
        });

        setBulkActionOpen(null);
        setSelectedLeads([]);
    };

    return (
        <div className="min-h-screen bg-white p-8">
            {/* ... (Header and Filters remain same) ... */}

            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
                        Leads
                        <span className="text-gray-400 text-lg font-normal">[{leads.length}]</span>
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">A complete overview of all leads in the organization</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                        onClick={() => window.open('http://localhost:3001/export', '_blank')}>
                        <Download size={14} />
                        Export as CSV
                    </button>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                    {/* Status Filter */}
                    <div className="relative group">
                        <button className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-md text-sm text-gray-700 hover:bg-gray-50">
                            <Filter size={14} />
                            {statusFilter}
                            <ChevronDown size={14} className="text-gray-400" />
                        </button>
                        <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-100 shadow-lg rounded-lg hidden group-hover:block z-20 py-1">
                            <div className="px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm" onClick={() => setStatusFilter("Any Status")}>Any Status</div>
                            {leadStatuses.map(status => (
                                <div key={status} className="px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm" onClick={() => setStatusFilter(status)}>{status}</div>
                            ))}
                        </div>
                    </div>

                    {/* Tag Filter */}
                    <div className="relative group">
                        <button className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-md text-sm text-gray-700 hover:bg-gray-50">
                            <Zap size={14} />
                            {tagFilter}
                            <ChevronDown size={14} className="text-gray-400" />
                        </button>
                        <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-100 shadow-lg rounded-lg hidden group-hover:block z-20 py-1">
                            <div className="px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm" onClick={() => setTagFilter("Any Tag")}>Any Tag</div>
                            <div className="px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm" onClick={() => setTagFilter("Interested")}>Interested</div>
                            <div className="px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm" onClick={() => setTagFilter("Automations")}>Automations</div>
                            <div className="px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm" onClick={() => setTagFilter("Achiever")}>Achiever</div>
                        </div>
                    </div>

                    {/* Score Filter */}
                    <div className="relative group">
                        <button className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-md text-sm text-gray-700 hover:bg-gray-50">
                            <Star size={14} />
                            {scoreRange}
                            <ChevronDown size={14} className="text-gray-400" />
                        </button>
                        <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-100 shadow-lg rounded-lg hidden group-hover:block z-20 py-1">
                            <div className="px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm" onClick={() => setScoreRange("All Scores")}>All Scores</div>
                            <div className="px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm" onClick={() => setScoreRange("> 50")}>Score &gt; 50</div>
                            <div className="px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm" onClick={() => setScoreRange("> 80")}>Score &gt; 80</div>
                            <div className="px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm" onClick={() => setScoreRange("< 50")}>Score &lt; 50</div>
                        </div>
                    </div>
                </div>

                <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search leads by name, email..."
                        className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Table */}
            <div className="border border-gray-200 rounded-xl shadow-sm bg-white">
                <LeadsTable
                    leads={filteredLeads}
                    selectedLeads={selectedLeads}
                    onToggleSelect={handleToggleSelect}
                    onUpdateStatus={handleUpdateStatus}
                    onUpdateTags={handleUpdateTags}
                />
            </div>

            {/* Floating Action Bar */}
            {selectedLeads.length > 0 && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-white shadow-2xl border border-gray-200 rounded-full px-6 py-3 flex items-center gap-6 animate-in slide-in-from-bottom-4 duration-200 z-50">
                    <div className="flex items-center gap-2 border-r border-gray-200 pr-6">
                        <span className="bg-black text-white text-xs font-bold px-2 py-0.5 rounded-full">{selectedLeads.length}</span>
                        <span className="text-sm font-medium text-gray-700">leads selected</span>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Status Bulk Action */}
                        <div className="relative">
                            <button
                                className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-gray-100 rounded-md text-sm font-medium text-gray-700 transition-colors"
                                onClick={() => setBulkActionOpen(bulkActionOpen === 'status' ? null : 'status')}
                            >
                                <Filter size={14} /> Status
                            </button>
                            {bulkActionOpen === 'status' && (
                                <div className="absolute bottom-full left-0 mb-2 w-48 bg-white border border-gray-100 shadow-xl rounded-lg z-50 py-1 animate-in fade-in zoom-in-95 duration-100">
                                    {leadStatuses.map(status => (
                                        <div
                                            key={status}
                                            className="px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm"
                                            onClick={() => handleBulkStatusChange(status)}
                                        >
                                            {status}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <button className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-gray-100 rounded-md text-sm font-medium text-gray-700 transition-colors" onClick={() => console.log('Assign')}>
                            <UserPlus size={14} /> Assign
                        </button>

                        {/* Tag Bulk Action */}
                        <div className="relative">
                            <button
                                className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-gray-100 rounded-md text-sm font-medium text-gray-700 transition-colors"
                                onClick={() => setBulkActionOpen(bulkActionOpen === 'tag' ? null : 'tag')}
                            >
                                <Zap size={14} /> Tag
                            </button>
                            {bulkActionOpen === 'tag' && (
                                <div className="absolute bottom-full left-0 mb-2 w-48 bg-white border border-gray-100 shadow-xl rounded-lg z-50 py-1 animate-in fade-in zoom-in-95 duration-100">
                                    <div className="px-3 py-2 text-xs font-medium text-gray-400 uppercase">Add Tag</div>
                                    {scoreTags.map(tag => (
                                        <div
                                            key={tag.label}
                                            className="px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm flex items-center gap-2"
                                            onClick={() => handleBulkTagAdd(tag.label)}
                                        >
                                            <Zap size={12} className="text-gray-400" />
                                            {tag.label}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="w-px h-4 bg-gray-200 mx-2" />
                        <button
                            className="text-gray-400 hover:text-gray-600"
                            onClick={() => setSelectedLeads([])}
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
