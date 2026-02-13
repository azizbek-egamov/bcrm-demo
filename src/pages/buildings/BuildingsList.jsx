import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { getBuildings, createBuilding, updateBuilding, deleteBuilding, getBuilding } from '../../services/buildings';
import { getCities } from '../../services/cities';
import { toast } from 'sonner';
import './Buildings.css';

const BuildingsList = () => {
    const [buildings, setBuildings] = useState([]);
    const [cities, setCities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [cityFilter, setCityFilter] = useState('');
    const [modal, setModal] = useState({ open: false, type: null, building: null });
    const [modalClosing, setModalClosing] = useState(false);
    const [formData, setFormData] = useState({
        code: '',
        city: '',
        name: '',
        location: '',
        floor: '',
        padez: '',
        padez_home: []
    });
    const [showPadezInputs, setShowPadezInputs] = useState(false);
    const [saving, setSaving] = useState(false);

    // Pagination
    const [pagination, setPagination] = useState({
        count: 0,
        page: 1,
        pageSize: 20,
        totalPages: 1
    });

    useEffect(() => {
        loadCities();
    }, []);

    useEffect(() => {
        loadBuildings();
    }, [pagination.page, search, cityFilter]);

    const loadBuildings = async () => {
        try {
            setLoading(true);
            const params = {
                page: pagination.page,
                page_size: pagination.pageSize
            };
            if (search) params.search = search;
            if (cityFilter) params.city = cityFilter;

            const data = await getBuildings(params);
            // Backend paginatsiya qaytaradi: { count, next, previous, results }
            // Yoki array qaytaradi
            const buildingsList = Array.isArray(data) ? data : (data.results || []);
            setBuildings(buildingsList);

            // Paginatsiya ma'lumotlarini yangilash
            const totalCount = Array.isArray(data) ? data.length : (data.count || buildingsList.length || 0);
            setPagination(prev => ({
                ...prev,
                count: totalCount,
                totalPages: Math.ceil(totalCount / prev.pageSize) || 1
            }));
        } catch (error) {
            console.error('Binolarni yuklashda xatolik:', error);
            toast.error('Binolarni yuklashda xatolik');
            setBuildings([]);
            setPagination(prev => ({
                ...prev,
                count: 0,
                totalPages: 1
            }));
        } finally {
            setLoading(false);
        }
    };

    const loadCities = async () => {
        try {
            const data = await getCities({ page_size: 1000 });
            const citiesList = data.results || data;
            setCities(Array.isArray(citiesList) ? citiesList : []);
        } catch (error) {
            console.error('Shaharlarni yuklashda xatolik:', error);
        }
    };

    const handleSearch = (e) => {
        const value = e.target.value;
        setSearch(value);
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const handleCityFilter = (e) => {
        const value = e.target.value;
        setCityFilter(value);
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            setPagination(prev => ({ ...prev, page: newPage }));
        }
    };

    const resetForm = () => {
        setFormData({
            code: '',
            city: '',
            name: '',
            location: '',
            floor: '',
            padez: '',
            padez_home: [],
            construction_status: 'new',
            budget: '',
            construction_start_date: '',
            construction_end_date: '',
            description: ''
        });
        setShowPadezInputs(false);
    };

    const openCreateModal = () => {
        resetForm();
        setModal({ open: true, type: 'create', building: null });
    };

    const openEditModal = async (building) => {
        try {
            const fullBuilding = await getBuilding(building.id);
            setFormData({
                code: fullBuilding.code || '',
                city: fullBuilding.city || '',
                name: fullBuilding.name || '',
                location: fullBuilding.location || '',
                floor: fullBuilding.floor || '',
                padez: fullBuilding.padez || '',
                padez_home: fullBuilding.padez_home || [],
                construction_status: fullBuilding.construction_status || 'new',
                budget: fullBuilding.budget || '',
                construction_start_date: fullBuilding.construction_start_date || '',
                construction_end_date: fullBuilding.construction_end_date || '',
                description: fullBuilding.description || ''
            });
            setShowPadezInputs(fullBuilding.padez_home && fullBuilding.padez_home.length > 0);
            setModal({ open: true, type: 'edit', building: fullBuilding });
        } catch (error) {
            toast.error('Bino ma\'lumotlarini yuklashda xatolik');
        }
    };

    const openDeleteModal = (building) => {
        setModal({ open: true, type: 'delete', building });
    };

    const closeModal = () => {
        setModalClosing(true);
        setTimeout(() => {
            setModal({ open: false, type: null, building: null });
            setModalClosing(false);
            resetForm();
        }, 250);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;

        // Faqat raqamlar uchun
        if (['floor', 'padez'].includes(name)) {
            if (value && !/^\d+$/.test(value)) return;
        }

        // Budget uchun maxsus format
        if (name === 'budget') {
            const numericValue = value.replace(/\s/g, '').replace(/[^\d]/g, '');
            setFormData(prev => ({ ...prev, [name]: numericValue }));
            return;
        }

        setFormData(prev => ({ ...prev, [name]: value }));

        // Padez o'zgarganda padez_home ni yangilash
        if (name === 'padez') {
            const padezCount = parseInt(value) || 0;
            if (padezCount > 0 && padezCount <= 20) {
                const newPadezHome = Array(padezCount).fill(0);
                // Eski qiymatlarni saqlab qolish
                formData.padez_home.forEach((val, idx) => {
                    if (idx < padezCount) newPadezHome[idx] = val;
                });
                setFormData(prev => ({ ...prev, padez_home: newPadezHome }));
            } else {
                setFormData(prev => ({ ...prev, padez_home: [] }));
                setShowPadezInputs(false);
            }
        }
    };

    // Raqamni formatlash funktsiyasi (1234567 -> 1 234 567)
    const formatNumber = (num) => {
        if (num === null || num === undefined || num === '') return '';
        const val = Math.floor(Number(num));
        if (isNaN(val)) return '';
        return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    };

    const handlePadezHomeChange = (index, value) => {
        if (value && !/^\d+$/.test(value)) return;

        const newPadezHome = [...formData.padez_home];
        newPadezHome[index] = parseInt(value) || 0;
        setFormData(prev => ({ ...prev, padez_home: newPadezHome }));
    };

    const handleShowPadezInputs = () => {
        const padezCount = parseInt(formData.padez) || 0;
        if (padezCount > 0 && padezCount <= 20) {
            if (formData.padez_home.length !== padezCount) {
                setFormData(prev => ({
                    ...prev,
                    padez_home: Array(padezCount).fill(0)
                }));
            }
            setShowPadezInputs(true);
        } else {
            toast.error('Padezlar sonini to\'g\'ri kiriting (1-20)');
        }
    };

    const validateForm = () => {
        if (!formData.code.trim()) {
            toast.error('Bino shifrini kiriting');
            return false;
        }
        if (formData.code.length > 6) {
            toast.error('Bino shifri 6 ta belgidan oshmasligi kerak');
            return false;
        }
        if (!formData.city) {
            toast.error('Shaharni tanlang');
            return false;
        }
        if (!formData.name.trim()) {
            toast.error('Bino nomini kiriting');
            return false;
        }
        if (!formData.floor || parseInt(formData.floor) <= 0) {
            toast.error('Qavatlar sonini kiriting');
            return false;
        }
        if (!formData.padez || parseInt(formData.padez) <= 0) {
            toast.error('Padezlar sonini kiriting');
            return false;
        }
        if (formData.padez_home.length !== parseInt(formData.padez)) {
            toast.error('Xonalarni kiritish tugmasini bosing');
            return false;
        }
        if (formData.padez_home.some(val => val <= 0)) {
            toast.error('Har bir padezdagi xonadonlar sonini kiriting');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        const data = {
            code: formData.code.toUpperCase(),
            city: parseInt(formData.city),
            name: formData.name.trim(),
            location: formData.location.trim() || null,
            floor: parseInt(formData.floor),
            padez: parseInt(formData.padez),
            padez_home: formData.padez_home,
            construction_status: formData.construction_status || 'new',
            budget: formData.budget ? parseFloat(formData.budget) : 0,
            construction_start_date: formData.construction_start_date || null,
            construction_end_date: formData.construction_end_date || null,
            description: formData.description || ''
        };

        try {
            setSaving(true);
            if (modal.type === 'edit') {
                await updateBuilding(modal.building.id, data);
                toast.success('Bino muvaffaqiyatli yangilandi');
            } else {
                await createBuilding(data);
                toast.success('Bino muvaffaqiyatli yaratildi');
            }
            closeModal();
            loadBuildings();
        } catch (error) {
            const errorMsg = error.response?.data?.detail ||
                error.response?.data?.code?.[0] ||
                error.response?.data?.padez_home?.[0] ||
                (modal.type === 'edit' ? 'Binoni yangilashda xatolik' : 'Bino yaratishda xatolik');
            toast.error(errorMsg);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!modal.building) return;
        try {
            setSaving(true);
            await deleteBuilding(modal.building.id);
            toast.success('Bino muvaffaqiyatli o\'chirildi');
            closeModal();
            loadBuildings();
        } catch (error) {
            const errorMsg = error.response?.data?.detail || 'Binoni o\'chirishda xatolik';
            toast.error(errorMsg);
        } finally {
            setSaving(false);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const day = date.getDate();
        const year = date.getFullYear();
        const months = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
            'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];
        return `${day}-${months[date.getMonth()]} ${year}`;
    };

    const isStructureLocked = modal.building?.status === true;

    return (
        <div className="buildings-page">
            <div className="page-header">
                <div className="header-left">
                    <h1 className="page-title">Binolar</h1>
                    <p className="page-subtitle">Barcha binolar ro'yxati</p>
                </div>
                <button className="btn-primary" onClick={openCreateModal}>
                    <PlusIcon />
                    <span>Bino qo'shish</span>
                </button>
            </div>

            <div className="page-content">
                <div className="content-card">
                    <div className="card-header">
                        <div className="filters-row">
                            <div className="search-box">
                                <SearchIcon />
                                <input
                                    type="text"
                                    placeholder="Bino nomi yoki shifri..."
                                    value={search}
                                    onChange={handleSearch}
                                />
                            </div>
                            <select
                                className="filter-select"
                                value={cityFilter}
                                onChange={handleCityFilter}
                            >
                                <option value="">Barcha shaharlar</option>
                                {cities.map(city => (
                                    <option key={city.id} value={city.id}>{city.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="results-count">
                            Jami: <strong>{pagination.count}</strong> ta bino
                        </div>
                    </div>

                    {loading ? (
                        <div className="loading-state">
                            <div className="spinner"></div>
                            <p>Yuklanmoqda...</p>
                        </div>
                    ) : buildings.length === 0 ? (
                        <div className="empty-state">
                            <EmptyIcon />
                            <h3>Binolar topilmadi</h3>
                            <p>Hozircha binolar mavjud emas yoki qidiruv natijasi topilmadi</p>
                            <button className="btn-primary" onClick={openCreateModal}>
                                <PlusIcon />
                                <span>Birinchi binoni qo'shish</span>
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="table-container">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Shifr</th>
                                            <th>Bino nomi</th>
                                            <th>Shahar</th>
                                            <th>Tuzilishi</th>
                                            <th>Byudjet</th>
                                            <th>Holat</th>
                                            <th>Sana</th>
                                            <th>Amallar</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {buildings.map((building, index) => (
                                            <tr
                                                key={building.id}
                                                onClick={() => openEditModal(building)}
                                                style={{ cursor: 'pointer' }}
                                                className="clickable-row"
                                            >
                                                <td className="cell-number">{(pagination.page - 1) * pagination.pageSize + index + 1}</td>
                                                <td className="cell-code">{building.code}</td>
                                                <td className="cell-name">{building.name}</td>
                                                <td className="cell-city">{building.city_name || '-'}</td>
                                                <td className="cell-structure">
                                                    <div style={{ display: 'flex', gap: '12px', fontSize: '13px' }}>
                                                        <div title="Qavatlar" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                            <span style={{ fontWeight: 600 }}>{building.floor}</span>
                                                            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>qavat</span>
                                                        </div>
                                                        <div style={{ borderLeft: '1px solid var(--border-color)' }}></div>
                                                        <div title="Padezlar" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                            <span style={{ fontWeight: 600 }}>{building.padez}</span>
                                                            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>padez</span>
                                                        </div>
                                                        <div style={{ borderLeft: '1px solid var(--border-color)' }}></div>
                                                        <div title="Xonadonlar" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                            <span style={{ fontWeight: 600 }}>{building.total_homes}</span>
                                                            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>xona</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="cell-budget">
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '12px' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                                                            <span style={{ color: 'var(--text-secondary)' }}>Jami:</span>
                                                            <span style={{ fontWeight: 600, color: '#6366f1' }}>{formatNumber(building.budget)}</span>
                                                        </div>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                                                            <span style={{ color: 'var(--text-secondary)' }}>Sarflangan:</span>
                                                            <span style={{ fontWeight: 600, color: '#ef4444' }}>{formatNumber(building.spent_amount)}</span>
                                                        </div>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', borderTop: '1px solid var(--border-color)', paddingTop: '2px', marginTop: '2px' }}>
                                                            <span style={{ color: 'var(--text-secondary)' }}>Qolgan:</span>
                                                            <span style={{ fontWeight: 600, color: '#10b981' }}>{formatNumber((building.budget || 0) - (building.spent_amount || 0))}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className={`status-badge ${building.status ? 'active' : 'inactive'}`}>
                                                        {building.status ? 'Yuklangan' : 'Bo\'sh'}
                                                    </span>
                                                </td>
                                                <td className="cell-date">{formatDate(building.created)}</td>
                                                <td className="cell-actions" onClick={(e) => e.stopPropagation()}>
                                                    <div className="table-actions">
                                                        <button
                                                            className="btn-icon btn-edit"
                                                            onClick={() => openEditModal(building)}
                                                            title="Tahrirlash"
                                                        >
                                                            <EditIcon />
                                                        </button>
                                                        <button
                                                            className="btn-icon btn-delete"
                                                            onClick={() => openDeleteModal(building)}
                                                            title="O'chirish"
                                                            disabled={building.status}
                                                        >
                                                            <TrashIcon />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {pagination.totalPages > 1 && (
                                <div className="pagination-container">
                                    <div className="pagination-info">
                                        Sahifa {pagination.page} / {pagination.totalPages}
                                    </div>
                                    <div className="pagination-controls">
                                        <button
                                            className="pagination-btn"
                                            onClick={() => handlePageChange(pagination.page - 1)}
                                            disabled={pagination.page === 1}
                                        >
                                            <ChevronLeftIcon />
                                        </button>
                                        {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                                            let pageNum;
                                            if (pagination.totalPages <= 5) {
                                                pageNum = i + 1;
                                            } else if (pagination.page <= 3) {
                                                pageNum = i + 1;
                                            } else if (pagination.page >= pagination.totalPages - 2) {
                                                pageNum = pagination.totalPages - 4 + i;
                                            } else {
                                                pageNum = pagination.page - 2 + i;
                                            }
                                            return (
                                                <button
                                                    key={pageNum}
                                                    className={`pagination-btn ${pagination.page === pageNum ? 'active' : ''}`}
                                                    onClick={() => handlePageChange(pageNum)}
                                                >
                                                    {pageNum}
                                                </button>
                                            );
                                        })}
                                        <button
                                            className="pagination-btn"
                                            onClick={() => handlePageChange(pagination.page + 1)}
                                            disabled={pagination.page === pagination.totalPages}
                                        >
                                            <ChevronRightIcon />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Create/Edit Modal */}
            {modal.open && (modal.type === 'create' || modal.type === 'edit') && createPortal(
                <div className={`modal-overlay ${modalClosing ? 'closing' : ''}`} onClick={closeModal}>
                    <div className={`modal-content modal-form modal-lg ${modalClosing ? 'closing' : ''}`} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{modal.type === 'edit' ? 'Binoni tahrirlash' : 'Yangi bino qo\'shish'}</h3>
                            <button className="modal-close" onClick={closeModal}>
                                <CloseIcon />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-form-body">
                                {/* Asosiy ma'lumotlar */}
                                <div className="form-section">
                                    <h4 className="form-section-title">
                                        <InfoIcon /> Asosiy ma'lumotlar
                                    </h4>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label htmlFor="code" className="required">Bino shifri</label>
                                            <input
                                                type="text"
                                                id="code"
                                                name="code"
                                                placeholder="Masalan: A1"
                                                value={formData.code}
                                                onChange={handleInputChange}
                                                maxLength={6}
                                                className="input-code"
                                            />
                                            <span className="input-hint">Maksimum 6 ta belgi</span>
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="city" className="required">Shahar</label>
                                            <select
                                                id="city"
                                                name="city"
                                                value={formData.city}
                                                onChange={handleInputChange}
                                            >
                                                <option value="">Shaharni tanlang</option>
                                                {cities.map(city => (
                                                    <option key={city.id} value={city.id}>{city.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="form-group form-group-wide">
                                            <label htmlFor="name" className="required">Bino nomi</label>
                                            <input
                                                type="text"
                                                id="name"
                                                name="name"
                                                placeholder="Bino nomini kiriting"
                                                value={formData.name}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="location">Bino joylashuvi</label>
                                        <textarea
                                            id="location"
                                            name="location"
                                            placeholder="Bino joylashuvini to'liq kiriting"
                                            value={formData.location}
                                            onChange={handleInputChange}
                                            rows={2}
                                        />
                                        <span className="input-hint">Masalan: Chilonzor tumani, 12-kvartal, 23-uy</span>
                                    </div>
                                </div>

                                {/* Bino tuzilishi */}
                                <div className="form-section">
                                    <h4 className="form-section-title">
                                        <BuildingSmallIcon /> Bino tuzilishi
                                        {isStructureLocked && (
                                            <span className="locked-badge">
                                                <LockIcon /> Bloklangan
                                            </span>
                                        )}
                                    </h4>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label htmlFor="floor" className="required">Qavatlar soni</label>
                                            <div className="input-with-suffix">
                                                <input
                                                    type="text"
                                                    id="floor"
                                                    name="floor"
                                                    placeholder="Qavatlar sonini kiriting"
                                                    value={formData.floor}
                                                    onChange={handleInputChange}
                                                    disabled={isStructureLocked}
                                                />
                                                <span className="input-suffix">qavat</span>
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="padez" className="required">Padezlar soni</label>
                                            <div className="input-with-suffix">
                                                <input
                                                    type="text"
                                                    id="padez"
                                                    name="padez"
                                                    placeholder="Padezlar sonini kiriting"
                                                    value={formData.padez}
                                                    onChange={handleInputChange}
                                                    disabled={isStructureLocked}
                                                />
                                                <span className="input-suffix">padez</span>
                                            </div>
                                        </div>
                                        <div className="form-group form-group-button">
                                            <button
                                                type="button"
                                                className="btn-secondary btn-padez"
                                                onClick={handleShowPadezInputs}
                                                disabled={!formData.padez || isStructureLocked}
                                            >
                                                <GridIcon />
                                                Xonalarni kiritish
                                            </button>
                                        </div>
                                    </div>

                                    {showPadezInputs && formData.padez_home.length > 0 && (
                                        <div className="padez-inputs-container">
                                            <p className="padez-inputs-label">Har bir padezdagi xonadonlar soni:</p>
                                            <div className="padez-inputs-grid">
                                                {formData.padez_home.map((value, index) => (
                                                    <div key={index} className="padez-input-item">
                                                        <label>{index + 1}-padez</label>
                                                        <input
                                                            type="text"
                                                            value={value || ''}
                                                            onChange={(e) => handlePadezHomeChange(index, e.target.value)}
                                                            placeholder="0"
                                                            disabled={isStructureLocked}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Qurilish va Byudjet */}
                                <div className="form-section">
                                    <h4 className="form-section-title">
                                        <InfoIcon /> Qurilish va Byudjet
                                    </h4>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label htmlFor="construction_status">Qurilish holati</label>
                                            <select
                                                id="construction_status"
                                                name="construction_status"
                                                value={formData.construction_status}
                                                onChange={handleInputChange}
                                            >
                                                <option value="new">Yangi</option>
                                                <option value="started">Qurilish boshlangan</option>
                                                <option value="finished">Tugatildi</option>
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="budget">Ajratilgan byudjet</label>
                                            <div className="input-with-suffix">
                                                <input
                                                    type="text"
                                                    id="budget"
                                                    name="budget"
                                                    placeholder="0"
                                                    value={formatNumber(formData.budget)}
                                                    onChange={handleInputChange}
                                                />
                                                <span className="input-suffix">so'm</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label htmlFor="construction_start_date">Qurilish boshlangan sana</label>
                                            <input
                                                type="date"
                                                id="construction_start_date"
                                                name="construction_start_date"
                                                value={formData.construction_start_date}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="construction_end_date">Taxminiy tugash sanasi</label>
                                            <input
                                                type="date"
                                                id="construction_end_date"
                                                name="construction_end_date"
                                                value={formData.construction_end_date}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="description">Bino tavsifi</label>
                                        <textarea
                                            id="description"
                                            name="description"
                                            placeholder="Bino haqida qo'shimcha ma'lumotlar"
                                            value={formData.description}
                                            onChange={handleInputChange}
                                            rows={2}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={closeModal}>
                                    Bekor qilish
                                </button>
                                <button type="submit" className="btn-primary" disabled={saving}>
                                    {saving ? (
                                        <>
                                            <div className="btn-spinner"></div>
                                            <span>Saqlanmoqda...</span>
                                        </>
                                    ) : (
                                        <>
                                            <SaveIcon />
                                            <span>{modal.type === 'edit' ? 'Saqlash' : 'Yaratish'}</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}

            {/* Delete Modal */}
            {modal.open && modal.type === 'delete' && createPortal(
                <div className={`modal-overlay ${modalClosing ? 'closing' : ''}`} onClick={closeModal}>
                    <div className={`modal-content ${modalClosing ? 'closing' : ''}`} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Binoni o'chirish</h3>
                            <button className="modal-close" onClick={closeModal}>
                                <CloseIcon />
                            </button>
                        </div>
                        <div className="modal-body" style={{ textAlign: 'center', padding: '32px 24px' }}>
                            <div className="modal-icon danger" style={{ margin: '0 auto 20px', width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <TrashIcon />
                            </div>
                            <p style={{ fontSize: '16px', color: 'var(--text-primary)', marginBottom: '8px' }}>
                                <strong>{modal.building?.code} - {modal.building?.name}</strong> binoni o'chirishni xohlaysizmi?
                            </p>
                            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                                Bu amalni ortga qaytarib bo'lmaydi.
                            </p>
                        </div>
                        <div className="modal-actions">
                            <button className="btn-secondary" onClick={closeModal}>
                                Bekor qilish
                            </button>
                            <button className="btn-danger" onClick={handleDelete} disabled={saving}>
                                {saving ? 'O\'chirilmoqda...' : 'O\'chirish'}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

// Icons
const PlusIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
);

const SearchIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
);

const EditIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
);

const TrashIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
);

const SaveIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
        <polyline points="17 21 17 13 7 13 7 21" />
        <polyline points="7 3 7 8 15 8" />
    </svg>
);

const CloseIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

const InfoIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
);

const BuildingSmallIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="4" y="2" width="16" height="20" rx="2" />
        <path d="M9 22v-4h6v4" />
        <path d="M8 6h.01M16 6h.01M8 10h.01M16 10h.01M8 14h.01M16 14h.01" />
    </svg>
);

const GridIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
    </svg>
);

const LockIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
);

const EmptyIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="4" y="2" width="16" height="20" rx="2" />
        <path d="M9 22v-4h6v4" />
        <path d="M8 6h.01M16 6h.01M8 10h.01M16 10h.01" />
    </svg>
);

const ChevronLeftIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="15 18 9 12 15 6" />
    </svg>
);

const ChevronRightIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="9 18 15 12 9 6" />
    </svg>
);

export default BuildingsList;
