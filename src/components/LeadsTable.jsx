import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Star, Zap, Award, DollarSign, Search, MoreHorizontal, Check, ChevronDown, Clock, Tag, X } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { leadStatuses, scoreTags } from '../mockData';
import { useNavigate } from 'react-router-dom';

function cn(...inputs) {
    return twMerge(clsx(inputs));
}

const StatusBadge = ({ status, onClick, showChevron = false }) => {
    const colors = {
        "Won": "bg-green-100 text-green-700",
        "Lost": "bg-red-100 text-red-700",
        "New Lead": "bg-blue-100 text-blue-700",
        "Call Booked": "bg-purple-100 text-purple-700",
        "Qualified": "bg-yellow-100 text-yellow-700",
        "Unqualified": "bg-gray-100 text-gray-700",
        "No Show": "bg-orange-100 text-orange-700",
        "Needs Followup": "bg-indigo-100 text-indigo-700",
        "Cold": "bg-slate-100 text-slate-600",
    };

    const baseClass = "px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit cursor-pointer hover:opacity-80 transition-opacity";
    const colorClass = colors[status] || "bg-gray-100 text-gray-700";

    return (
        <div className={cn(baseClass, colorClass)} onClick={onClick}>
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            {status}
            {showChevron && <ChevronDown size={10} className="ml-1 opacity-50" />}
        </div>
    );
};

export default function LeadsTable({ leads, selectedLeads, onToggleSelect, onUpdateStatus, onUpdateTags }) {
    const navigate = useNavigate();
    const [editingStatusId, setEditingStatusId] = useState(null);
    const [editingTagsId, setEditingTagsId] = useState(null);
    const statusDropdownRef = useRef(null);
    const tagsDropdownRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target)) {
                setEditingStatusId(null);
            }
            if (tagsDropdownRef.current && !tagsDropdownRef.current.contains(event.target)) {
                setEditingTagsId(null);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleRowClick = (e, leadId) => {
        if (e.target.closest('button') || e.target.closest('input') || e.target.closest('.interactive-cell')) {
            return;
        }
        navigate(`/leads/${leadId}`);
    };

    return (
        <div className="overflow-visible min-h-[400px]">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="text-xs text-gray-500 border-b border-gray-100">
                        <th className="p-4 w-10">
                            <input
                                type="checkbox"
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                checked={leads.length > 0 && selectedLeads.length === leads.length}
                                onChange={() => onToggleSelect('all')}
                            />
                        </th>
                        <th className="p-4 font-medium">Lead name</th>
                        <th className="p-4 font-medium">Status</th>
                        <th className="p-4 font-medium">Tag-uri</th>
                        <th className="p-4 font-medium">Scor</th>
                        <th className="p-4 font-medium">Last Interaction</th>
                        <th className="p-4 font-medium">Sursa Leadului</th>
                    </tr>
                </thead>
                <tbody className="text-sm">
                    {leads.map((lead) => (
                        <tr
                            key={lead.id}
                            className={cn(
                                "border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer group",
                                selectedLeads.includes(lead.id) && "bg-blue-50/30"
                            )}
                            onClick={(e) => handleRowClick(e, lead.id)}
                        >
                            <td className="p-4 interactive-cell">
                                <input
                                    type="checkbox"
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    checked={selectedLeads.includes(lead.id)}
                                    onChange={() => onToggleSelect(lead.id)}
                                />
                            </td>
                            <td className="p-4">
                                <div className="flex items-center gap-3">
                                    <img src={lead.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                                    <span className="font-medium text-gray-900">{lead.name}</span>
                                    {lead.unreadMessages > 0 && (
                                        <span className="bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                                            {lead.unreadMessages}
                                        </span>
                                    )}
                                </div>
                            </td>
                            <td className="p-4 interactive-cell relative">
                                <StatusBadge status={lead.status} onClick={() => setEditingStatusId(lead.id)} showChevron={true} />
                                {editingStatusId === lead.id && (
                                    <div ref={statusDropdownRef} className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-xl border border-gray-100 z-50 py-1 animate-in fade-in zoom-in-95 duration-100">
                                        {leadStatuses.map(status => (
                                            <div
                                                key={status}
                                                className="px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm flex items-center justify-between"
                                                onClick={() => {
                                                    onUpdateStatus(lead.id, status);
                                                    setEditingStatusId(null);
                                                }}
                                            >
                                                <StatusBadge status={status} />
                                                {lead.status === status && <Check size={14} className="text-blue-600" />}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </td>
                            <td className="p-4 interactive-cell relative">
                                <div className="flex flex-wrap gap-2">
                                    {lead.tags.map(tag => (
                                        <span key={tag} className="px-2 py-1 bg-gray-100 rounded-md text-xs text-gray-600 flex items-center gap-1 group/tag">
                                            <Tag size={10} className="text-blue-400" />
                                            {tag}
                                            <button
                                                className="opacity-0 group-hover/tag:opacity-100 hover:text-red-500 transition-opacity"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onUpdateTags(lead.id, tag);
                                                }}
                                            >
                                                <X size={10} />
                                            </button>
                                        </span>
                                    ))}
                                    <button
                                        onClick={() => setEditingTagsId(lead.id)}
                                        className="text-xs text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity px-1"
                                    >
                                        + Add
                                    </button>
                                </div>
                                {editingTagsId === lead.id && (
                                    <div ref={tagsDropdownRef} className="absolute top-full left-0 mt-1 w-56 bg-white rounded-lg shadow-xl border border-gray-100 z-50 py-1 p-2">
                                        <div className="space-y-1">
                                            {scoreTags.map(tag => (
                                                <div
                                                    key={tag.label}
                                                    className="px-2 py-1.5 hover:bg-gray-50 cursor-pointer text-sm rounded flex items-center justify-between"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onUpdateTags(lead.id, tag.label);
                                                        // Keep open for multiple selection
                                                    }}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        {tag.label}
                                                    </div>
                                                    {lead.tags.includes(tag.label) && <Check size={14} className="text-blue-600" />}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </td>
                            <td className="p-4">
                                <div className="flex items-center gap-1 font-medium text-gray-700">
                                    <Star size={14} className="text-yellow-400 fill-yellow-400" />
                                    {lead.score}
                                </div>
                            </td>
                            <td className="p-4 text-gray-500 text-xs">
                                {lead.interacted}
                            </td>
                            <td className="p-4">
                                <span className="text-sm text-gray-600 bg-gray-50 px-2 py-1 rounded border border-gray-100">
                                    {lead.source}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
