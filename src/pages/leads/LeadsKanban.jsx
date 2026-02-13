import React, { useState, useEffect } from 'react';
import { leadService } from '../../services/leads';
import { useOutletContext } from 'react-router-dom';
import { toast } from 'sonner';
import StatusManagement from './StatusManagement';
import ConvertLeadModal from './ConvertLeadModal';
import QuickLeadForm from './QuickLeadForm';
import './StatusManagement.css';
import './LeadsKanban.css';
import { getForms } from '../../services/forms';

// Icons
const SearchIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
);

const SettingsIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="3"></circle>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1-2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
    </svg>
);

const PhoneIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
    </svg>
);

const CalendarIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="16" y1="2" x2="16" y2="6"></line>
        <line x1="8" y1="2" x2="8" y2="6"></line>
        <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
);

const UserIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
    </svg>
);

const RefreshIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="23 4 23 10 17 10"></polyline>
        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
    </svg>
);

const ConvertIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M16 3h5v5"></path>
        <path d="M8 21H3v-5"></path>
        <path d="M21 3l-7 7"></path>
        <path d="M3 21l7-7"></path>
    </svg>
);

// Stats Card Component
const StatCard = ({ title, value, icon, gradient }) => (
    <div className="stat-card" style={{ background: gradient }}>
        <div className="stat-info">
            <span className="stat-title">{title}</span>
            <span className="stat-value">{value}</span>
        </div>
        <div className="stat-icon">{icon}</div>
    </div>
);

// Lead Card Component
const LeadCard = ({ lead, onClick, onConvert, onDragStart, onDragEnd }) => {
    const formatDateTime = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        const months = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
            'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];
        const day = date.getDate();
        const month = months[date.getMonth()];
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${day}-${month} ${year} ${hours}:${minutes}`;
    };

    const formatPhone = (phone) => {
        if (!phone) return '';
        const digits = phone.replace(/\D/g, '');
        if (digits.length >= 12) {
            return `+${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 8)} ${digits.slice(8, 10)} ${digits.slice(10, 12)}`;
        }
        return phone;
    };

    const getInitials = (name) => {
        if (!name) return '?';
        return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    };

    const getStatusInfo = (status) => {
        const statusMap = {
            'answered': { label: 'Javob berdi', class: 'status-answered' },
            'not_answered': { label: 'Javob bermadi', class: 'status-not-answered' },
            'client_answered': { label: 'Mijoz javob berdi', class: 'status-client-answered' },
            'client_not_answered': { label: "Mijoz ko'tarmadi", class: 'status-client-not-answered' }
        };
        return statusMap[status] || null;
    };

    const statusInfo = getStatusInfo(lead.call_status);

    return (
        <div
            className="lead-card"
            draggable={!lead.is_converted}
            onDragStart={(e) => onDragStart(e, lead)}
            onDragEnd={onDragEnd}
            onClick={onClick}
        >
            <div className="lead-card-top">
                <div className="lead-avatar">
                    {getInitials(lead.client_name)}
                </div>
                <div className="lead-info">
                    <span className="lead-name">{lead.client_name || "Noma'lum"}</span>
                    <span className="lead-date">
                        <CalendarIcon /> {formatDateTime(lead.created_at)}
                    </span>
                </div>
            </div>

            <div className="lead-card-row">
                <PhoneIcon />
                <span>{formatPhone(lead.phone_number)}</span>
            </div>

            {statusInfo && (
                <div className="lead-card-row">
                    <span className={`lead-status-badge ${statusInfo.class}`}>
                        {statusInfo.label}
                    </span>
                </div>
            )}

            <div className="lead-card-actions">
                <span className="action-link" onClick={(e) => { e.stopPropagation(); onClick(); }}>
                    Tahrirlash
                </span>
                {!lead.is_converted && (
                    <span className="action-link delete" onClick={(e) => { e.stopPropagation(); onConvert(lead); }}>
                        Aylantirish
                    </span>
                )}
            </div>
        </div>
    );
};

import ScrollHint from '../../components/ScrollHint';

const LeadsKanban = () => {
    const { openCreateModal, openEditModal, refreshTrigger } = useOutletContext();

    const [columns, setColumns] = useState([]);
    const [stats, setStats] = useState({ total: 0, today: 0, converted: 0, answered: 0 });
    const [loading, setLoading] = useState(true);
    const [globalSearch, setGlobalSearch] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [convertModal, setConvertModal] = useState({ isOpen: false, lead: null });
    const [draggedLead, setDraggedLead] = useState(null);
    const [quickAddColumn, setQuickAddColumn] = useState(null);
    const [availableForms, setAvailableForms] = useState([]);
    const [formFilter, setFormFilter] = useState('all');

    useEffect(() => {
        const fetchForms = async () => {
            try {
                const response = await getForms();
                const formsData = response.data?.results || response.data;
                setAvailableForms(Array.isArray(formsData) ? formsData : []);
            } catch (error) {
                console.error("Fetch forms error:", error);
            }
        };
        fetchForms();
    }, []);

    const loadData = async () => {
        if (columns.length === 0) setLoading(true);
        try {
            const params = {};
            if (globalSearch) params.search = globalSearch;
            if (dateFrom) params.date_from = dateFrom;
            if (dateTo) params.date_to = dateTo;

            const [kanbanRes, statsRes] = await Promise.all([
                leadService.getKanban(params),
                leadService.getStatistics().catch(() => ({ data: {} }))
            ]);
            setColumns(kanbanRes.data);
            if (statsRes.data) {
                setStats({
                    total: statsRes.data.total || 0,
                    today: statsRes.data.today || 0,
                    converted: statsRes.data.converted || 0,
                    answered: statsRes.data.answered || 0
                });
            }
        } catch (error) {
            console.error("Load error:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [refreshTrigger, globalSearch, dateFrom, dateTo]);

    // Drag and drop handlers
    const handleDragStart = (e, lead) => {
        if (lead.is_converted) return;
        setDraggedLead(lead);
        e.dataTransfer.effectAllowed = 'move';
        e.target.classList.add('dragging');
    };

    const handleDragEnd = (e) => {
        e.target.classList.remove('dragging');
        setDraggedLead(null);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDragEnter = (e, stageId) => {
        e.preventDefault();
        e.currentTarget.classList.add('drag-over');
    };

    const handleDragLeave = (e) => {
        if (e.currentTarget.contains(e.relatedTarget)) return;
        e.currentTarget.classList.remove('drag-over');
    };

    const handleDrop = async (e, targetStageId) => {
        e.preventDefault();
        e.currentTarget.classList.remove('drag-over');

        if (!draggedLead || draggedLead.stage === targetStageId) {
            return;
        }

        try {
            await leadService.patch(draggedLead.id, { stage: targetStageId });
            toast.success("Lead bosqichi o'zgartirildi");
            loadData();
        } catch (error) {
            console.error(error);
            toast.error("Xatolik yuz berdi");
        }
    };

    const getDefaultColor = (index) => {
        const colors = ['#eab308', '#f97316', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4'];
        return colors[index % colors.length];
    };

    return (
        <div className="leads-kanban-container">
            {/* Stats Row */}
            <div className="stats-row">
                <StatCard
                    title="Jami Leadlar"
                    value={stats.total}
                    gradient="var(--gradient-primary)"
                    icon={<PhoneIcon />}
                />
                <StatCard
                    title="Bugungi"
                    value={stats.today}
                    gradient="var(--gradient-success)"
                    icon={<CalendarIcon />}
                />
                <StatCard
                    title="Mijozga Aylangan"
                    value={stats.converted}
                    gradient="linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
                    icon={<UserIcon />}
                />
                <StatCard
                    title="Javob Bergan"
                    value={stats.answered}
                    gradient="linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)"
                    icon={<PhoneIcon />}
                />
            </div>

            {/* Toolbar */}
            <div className="leads-toolbar">
                <div className="toolbar-left">
                    <div className="leads-search-box">
                        <SearchIcon />
                        <input
                            type="text"
                            placeholder="Qidirish..."
                            value={globalSearch}
                            onChange={(e) => setGlobalSearch(e.target.value)}
                        />
                    </div>
                    <div className="date-filter-group">
                        <div className="date-filter">
                            <label>Dan</label>
                            <input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                            />
                        </div>
                        <span className="date-filter-divider"></span>
                        <div className="date-filter">
                            <label>Gacha</label>
                            <input
                                type="date"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                            />
                        </div>
                        {(dateFrom || dateTo) && (
                            <button
                                className="clear-filter-btn"
                                onClick={() => { setDateFrom(''); setDateTo(''); }}
                                title="Filterni tozalash"
                            >
                                ✕
                            </button>
                        )}
                    </div>
                    <button className="btn-v2 btn-v2-dark" onClick={loadData}>
                        <RefreshIcon />
                        <span>Yangilash</span>
                    </button>
                </div>

                <div className="toolbar-right">
                    <button
                        className="btn-v2 btn-v2-dark"
                        onClick={() => setShowStatusModal(true)}
                    >
                        <SettingsIcon />
                        <span>Bosqichlarni boshqarish</span>
                    </button>
                </div>
            </div>

            <ScrollHint />

            {/* Kanban Board */}
            {loading ? (
                <div className="kanban-loading">
                    <div className="spinner"></div>
                </div>
            ) : (
                <div className="kanban-scroll-container">
                    <div className="kanban-board">
                        {columns.map((col, index) => (
                            <div
                                key={col.id}
                                className="kanban-column"
                                style={{ '--column-color': col.color || getDefaultColor(index) }}
                                onDragOver={handleDragOver}
                                onDragEnter={(e) => handleDragEnter(e, col.id)}
                                onDragLeave={handleDragLeave}
                                onDrop={(e) => handleDrop(e, col.id)}
                            >
                                <div className="column-header">
                                    <div className="column-title">
                                        <span className="title-text">{col.name}</span>
                                        <span className="item-count">
                                            {(col.name.toLowerCase() === 'formalar' && formFilter !== 'all')
                                                ? col.items?.filter(l => l.source_form === parseInt(formFilter)).length
                                                : (col.items?.length || 0)
                                            }
                                        </span>
                                    </div>
                                    {col.name.toLowerCase() === 'formalar' && (
                                        <select
                                            className="column-filter-select"
                                            value={formFilter}
                                            onChange={(e) => setFormFilter(e.target.value)}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <option value="all">Barcha formalar</option>
                                            {availableForms.map(f => (
                                                <option key={f.id} value={f.id}>{f.name}</option>
                                            ))}
                                        </select>
                                    )}
                                </div>

                                {quickAddColumn === col.id ? (
                                    <div className="quick-add-wrapper slide-down">
                                        <QuickLeadForm
                                            stageId={col.id}
                                            onCancel={() => setQuickAddColumn(null)}
                                            onSuccess={() => {
                                                setQuickAddColumn(null);
                                                loadData();
                                            }}
                                        />
                                    </div>
                                ) : (
                                    <button
                                        className="add-lead-button"
                                        onClick={() => setQuickAddColumn(col.id)}
                                    >
                                        + Lead qo'shish
                                    </button>
                                )}

                                <div className="column-items">
                                    {col.items?.filter(lead => {
                                        if (col.name.toLowerCase() === 'formalar' && formFilter !== 'all') {
                                            return lead.source_form === parseInt(formFilter);
                                        }
                                        return true;
                                    }).map(lead => (
                                        <LeadCard
                                            key={lead.id}
                                            lead={lead}
                                            onClick={() => openEditModal(lead)}
                                            onConvert={(l) => setConvertModal({ isOpen: true, lead: l })}
                                            onDragStart={handleDragStart}
                                            onDragEnd={handleDragEnd}
                                        />
                                    ))}
                                    {(!col.items || col.items.length === 0) && (
                                        <div className="empty-column">
                                            <span>Lead yo'q</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Status Management Modal */}
            <StatusManagement
                isOpen={showStatusModal}
                onClose={() => setShowStatusModal(false)}
                onSuccess={loadData}
            />

            {/* Convert Lead Modal */}
            <ConvertLeadModal
                isOpen={convertModal.isOpen}
                lead={convertModal.lead}
                onClose={() => setConvertModal({ isOpen: false, lead: null })}
                onSuccess={loadData}
            />
        </div>
    );
};

export default LeadsKanban;
