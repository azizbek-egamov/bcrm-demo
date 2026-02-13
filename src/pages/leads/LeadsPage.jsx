import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import usePageTitle from '../../hooks/usePageTitle';
import './Leads.css';
import LeadForm from './LeadForm';

// Icons
const PlusIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
);

const LeadsPage = () => {
    usePageTitle('Leadlar');
    const navigate = useNavigate();
    const location = useLocation();

    // Total leads count for header
    const [totalLeads, setTotalLeads] = useState(0);

    // Modal State
    const [modal, setModal] = useState({
        open: false,
        lead: null,
        initialStageId: null,
        type: 'create'
    });

    // Refresh trigger
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Redirect to kanban by default
    useEffect(() => {
        if (location.pathname === '/leads' || location.pathname === '/leads/') {
            navigate('kanban', { replace: true });
        }
    }, [location.pathname, navigate]);

    // Handlers
    const openCreateModal = (initialStageId = null) => {
        setModal({ open: true, lead: null, initialStageId, type: 'create' });
    };

    const openEditModal = (lead) => {
        setModal({ open: true, lead, initialStageId: null, type: 'edit' });
    };

    const closeModal = () => {
        setModal({ open: false, lead: null, initialStageId: null, type: 'create' });
    };

    const handleSuccess = () => {
        setRefreshTrigger(prev => prev + 1);
    };

    // Update total leads count from child
    const updateTotalLeads = (count) => {
        setTotalLeads(count);
    };

    return (
        <div className="leads-page">
            {/* Page Header - Like Contracts */}
            <div className="page-header">
                <div className="header-left">
                    <div>
                        <h1 className="page-title">Leadlar</h1>
                        <p className="page-subtitle">Jami {totalLeads} ta lead</p>
                    </div>
                </div>
                <div className="header-actions">
                    <button className="btn-primary" onClick={() => openCreateModal()}>
                        <PlusIcon />
                        Lead qo'shish
                    </button>
                </div>
            </div>

            <div className="page-content">
                <Outlet context={{
                    openCreateModal,
                    openEditModal,
                    refreshTrigger,
                    updateTotalLeads
                }} />
            </div>

            {/* Modal */}
            <LeadForm
                isOpen={modal.open}
                onClose={closeModal}
                lead={modal.lead}
                initialStageId={modal.initialStageId}
                onSuccess={handleSuccess}
            />
        </div>
    );
};

export default LeadsPage;
