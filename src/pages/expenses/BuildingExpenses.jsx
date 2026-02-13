import { useState, useEffect } from 'react';
import * as buildingsService from '../../services/buildings';
import expensesService from '../../services/expenses';
import { toast } from 'sonner';
import './Expenses.css';
import {
    PlusIcon,
    SearchIcon,
    EmptyIcon,
    WalletIcon,
    InfoIcon,
    CloseIcon,
    ChevronLeftIcon,
    ChevronRightIcon
} from './ExpenseIcons';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';

const BuildingExpenses = () => {
    const [buildings, setBuildings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    // List Filters
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [filterUser, setFilterUser] = useState('');

    // Filter Options
    const [categories, setCategories] = useState([]);
    const [users, setUsers] = useState([]);
    const [selectedBuilding, setSelectedBuilding] = useState(null);

    // Stats & Data State
    const [stats, setStats] = useState(null);
    const [statsLoading, setStatsLoading] = useState(false);
    const [expensesList, setExpensesList] = useState([]);
    const [listLoading, setListLoading] = useState(false);

    // UI State
    const [activeTab, setActiveTab] = useState('list'); // 'list' | 'stats'

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const PAGE_SIZE = 20;

    // Detail List Pagination
    const [expensesPage, setExpensesPage] = useState(1);
    const [expensesTotalPages, setExpensesTotalPages] = useState(1);
    const EXPENSES_PAGE_SIZE = 20;

    // Premium Chart Colors - Modern & Accessible
    const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#8b5cf6', '#ec4899', '#f472b6'];

    const CustomTooltip = ({ active, payload, label, formatter }) => {
        if (active && payload && payload.length) {
            return (
                <div style={{
                    backgroundColor: 'var(--bg-primary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                    padding: '12px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                }}>
                    <p style={{ margin: '0 0 8px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{label}</p>
                    {payload.map((item, index) => (
                        <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: item.color }}></div>
                            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{item.name}:</span>
                            <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                                {formatter ? formatter(item.value) : item.value}
                            </span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    useEffect(() => {
        loadBuildings();
        loadFilterOptions();
    }, [currentPage]);

    // Refresh list or stats when filters change (if a building is selected)
    useEffect(() => {
        if (selectedBuilding) {
            console.log("Effect triggered by:", { startDate, endDate, filterCategory, filterUser, activeTab, expensesPage });
            if (activeTab === 'list') {
                loadExpensesList(selectedBuilding);
            } else if (activeTab === 'stats') {
                loadStats(selectedBuilding);
            }
        }
    }, [startDate, endDate, filterCategory, filterUser, activeTab, expensesPage]);

    // Reset page when filters change
    useEffect(() => {
        console.log("Resetting page due to filter change");
        setExpensesPage(1);
    }, [startDate, endDate, filterCategory, filterUser]);

    const loadFilterOptions = async () => {
        try {
            const [cats] = await Promise.all([
                expensesService.getCategories({ active_only: true })
            ]);
            setCategories(cats.results || cats);
        } catch (e) {
            console.error("Filter options loading failed", e);
        }
    };

    const loadBuildings = async () => {
        try {
            setLoading(true);
            const data = await buildingsService.getBuildings({ page: currentPage, page_size: PAGE_SIZE });
            if (data.results) {
                setBuildings(data.results);
                setTotalPages(Math.ceil(data.count / PAGE_SIZE));
            } else {
                setBuildings(data);
            }
        } catch (error) {
            console.error(error);
            toast.error("Binolarni yuklashda xatolik");
        } finally {
            setLoading(false);
        }
    };

    const loadExpensesList = async (building = selectedBuilding) => {
        if (!building) return;
        setListLoading(true);
        try {
            const params = {
                building: building.id,
                page: expensesPage,
                page_size: EXPENSES_PAGE_SIZE,
                start_date: startDate || undefined,
                end_date: endDate || undefined,
                category: filterCategory || undefined,
                user: filterUser || undefined
            };
            console.log("loadExpensesList params:", params);
            const data = await expensesService.getExpenses(params);
            setExpensesList(data.results || data);

            if (data.count) {
                setExpensesTotalPages(Math.ceil(data.count / EXPENSES_PAGE_SIZE));
            } else {
                setExpensesTotalPages(1);
            }

            // Extract unique users from the loaded expenses if we don't have a users endpoint
            // This is a simple workaround to populate the users filter
            const uniqueUsers = {};
            (data.results || data).forEach(item => {
                if (item.created_by && item.created_by_name) {
                    uniqueUsers[item.created_by] = item.created_by_name; // created_by is ID
                }
            });
            setUsers(Object.entries(uniqueUsers).map(([id, name]) => ({ id, name })));

        } catch (err) {
            console.error(err);
            if (err.response) {
                toast.error(`Xatolik: ${err.response.status} - ${JSON.stringify(err.response.data)}`);
            } else {
                toast.error("Ro'yxatni yuklashda xatolik: Serverga ulanib bo'lmadi");
            }
        } finally {
            setListLoading(false);
        }
    };

    const loadStats = async (building = selectedBuilding, overrideParams = null) => {
        if (!building) return;
        setStatsLoading(true);
        try {
            const params = overrideParams || {
                start_date: startDate || undefined,
                end_date: endDate || undefined,
                user: filterUser || undefined
            };
            console.log("Loading Stats with params:", params);
            const data = await expensesService.getBuildingStats(building.id, params);
            setStats(data);
        } catch (err) {
            console.error(err);
            toast.error("Statistikani yuklashda xatolik");
        } finally {
            setStatsLoading(false);
        }
    };

    const loadBuildingData = async (building) => {
        try {
            setSelectedBuilding(building);

            // Reset filters when switching buildings
            setStartDate('');
            setEndDate('');
            setFilterCategory('');
            setFilterUser('');

            // Load Stats with explicitly cleared filters
            // We pass building explicitly because state selectedBuilding might not be updated yet
            await loadStats(building, { start_date: undefined, end_date: undefined, user: undefined });

            // Load List with initial (empty) filters
            setExpensesPage(1); // Reset to page 1
            loadExpensesList(building);

        } catch (error) {
            console.error(error);
        }
    };



    const formatPrice = (price) => {
        return new Intl.NumberFormat('uz-UZ').format(price || 0) + " so'm";
    };

    const getProgress = (spent, budget) => {
        if (!budget || budget === 0) return 0;
        return Math.min(Math.round((spent / budget) * 100), 100);
    };

    // --- Chart Components ---
    const CategoryPieChart = ({ data }) => {
        if (!data || data.length === 0) return <div>Ma'lumot yo'q</div>;
        return (
            <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="total"
                        stroke="none"
                        nameKey="category__name"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip formatter={formatPrice} />} />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: 10, fontSize: 12, color: 'var(--text-secondary)' }} />
                </PieChart>
            </ResponsiveContainer>
        );
    };

    const MonthlyBarChart = ({ data }) => (
        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} opacity={0.5} />
                <XAxis
                    dataKey="month"
                    tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }}
                    axisLine={{ stroke: 'var(--border-color)' }}
                    tickLine={false}
                />
                <YAxis
                    tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }}
                    axisLine={false}
                    tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
                    tickLine={false}
                />
                <Tooltip content={<CustomTooltip formatter={formatPrice} />} />
                <Bar dataKey="total" name="Xarajat" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={30} />
            </BarChart>
        </ResponsiveContainer>
    );

    const DailyAreaChart = ({ data }) => (
        <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data}>
                <defs>
                    <linearGradient id="colorDaily" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} opacity={0.5} />
                <XAxis
                    dataKey="day"
                    tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }}
                    axisLine={{ stroke: 'var(--border-color)' }}
                    tickLine={false}
                />
                <YAxis
                    tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }}
                    axisLine={false}
                    tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
                    tickLine={false}
                />
                <Tooltip content={<CustomTooltip formatter={formatPrice} />} />
                <Area
                    type="monotone"
                    dataKey="total"
                    name="Kunlik"
                    stroke="#10b981"
                    strokeWidth={3}
                    fill="url(#colorDaily)"
                    dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                />
            </AreaChart>
        </ResponsiveContainer>
    );

    const UserBarChart = ({ data }) => (
        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" horizontal={false} opacity={0.5} />
                <XAxis
                    type="number"
                    tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }}
                    axisLine={false}
                    tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
                    tickLine={false}
                />
                <YAxis
                    dataKey="name"
                    type="category"
                    width={100}
                    tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }}
                    axisLine={{ stroke: 'var(--border-color)' }}
                    tickLine={false}
                />
                <Tooltip content={<CustomTooltip formatter={formatPrice} />} />
                <Bar dataKey="total" name="Summa" fill="#f59e0b" radius={[0, 4, 4, 0]} barSize={20} />
            </BarChart>
        </ResponsiveContainer>
    );

    return (
        <div className="clients-page building-expenses-page">
            <div className="page-header">
                <div className="header-left">
                    <h1 className="page-title">Ob'ektlar tahlili</h1>
                    <p className="page-subtitle">Binolar bo'yicha xarajatlar va byudjet nazorati</p>
                </div>
            </div>

            <div className={`page-content building-expenses-layout ${selectedBuilding ? 'has-selection' : ''}`}>
                {/* Binolar ro'yxati (Left Panel) */}
                <div className="content-card buildings-sidebar">
                    <div className="card-header">
                        <div className="search-box" style={{ width: '100%' }}>
                            <SearchIcon />
                            <input
                                type="text"
                                placeholder="Binoni qidirish..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="buildings-list-scroll">
                        {loading ? (
                            <div className="loading-state"><div className="spinner"></div></div>
                        ) : buildings.filter(b => b.name.toLowerCase().includes(search.toLowerCase()) || b.code.toLowerCase().includes(search.toLowerCase())).length === 0 ? (
                            <div className="empty-state">Topilmadi</div>
                        ) : (
                            <>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {buildings.filter(b => b.name.toLowerCase().includes(search.toLowerCase()) || b.code.toLowerCase().includes(search.toLowerCase())).map(b => (
                                        <div
                                            key={b.id}
                                            className={`building-item ${selectedBuilding?.id === b.id ? 'active' : ''}`}
                                            onClick={() => loadBuildingData(b)}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                <strong className="building-name">{b.name}</strong>
                                                <span className="building-code">{b.code}</span>
                                            </div>
                                            <div className="building-budget">
                                                Budget: {formatPrice(b.budget)}
                                            </div>
                                            <div className="progress-mini">
                                                <div style={{
                                                    width: `${getProgress(b.spent_amount, b.budget)}%`,
                                                    height: '100%',
                                                    background: getProgress(b.spent_amount, b.budget) > 90 ? '#ef4444' : '#6366f1'
                                                }}></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {totalPages > 1 && (
                                    <div className="pagination-mini">
                                        <button className="btn btn-secondary" onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} style={{ padding: '6px 12px', fontSize: '13px' }}>Ortga</button>
                                        <span style={{ fontSize: '13px', alignSelf: 'center', color: 'var(--text-secondary)' }}>{currentPage} / {totalPages}</span>
                                        <button className="btn btn-secondary" onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages} style={{ padding: '6px 12px', fontSize: '13px' }}>Oldinga</button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* Right Panel (Content) */}
                <div className="content-card building-detail-panel">
                    {!selectedBuilding ? (
                        <div className="empty-state-full">
                            <InfoIcon />
                            <h3>Bino tanlanmagan</h3>
                            <p>Tahlilni ko'rish uchun chap tomondan binoni tanlang</p>
                        </div>
                    ) : (
                        <div className="building-stats-detail">
                            {/* Mobile Back Button */}
                            <button className="btn-back-mobile" onClick={() => setSelectedBuilding(null)}>
                                <ChevronLeftIcon />
                                <span>Binolar ro'yxatiga qaytish</span>
                            </button>

                            {/* Header & Tabs */}
                            <div className="building-detail-header">
                                <div>
                                    <h2 className="detail-title">{selectedBuilding.name}</h2>
                                    <div className="segmented-tabs">
                                        <button
                                            className={`segmented-tab ${activeTab === 'list' ? 'active' : ''}`}
                                            onClick={() => setActiveTab('list')}
                                        >
                                            <WalletIcon style={{ width: 18, height: 18 }} />
                                            <span>Ro'yxat</span>
                                        </button>
                                        <button
                                            className={`segmented-tab ${activeTab === 'stats' ? 'active' : ''}`}
                                            onClick={() => setActiveTab('stats')}
                                        >
                                            <InfoIcon style={{ width: 18, height: 18 }} />
                                            <span>Statistika</span>
                                        </button>
                                    </div>
                                </div>
                                {stats && (
                                    <div className="budget-summary">
                                        <div className="summary-label">Qolgan byudjet</div>
                                        <div className={`summary-value ${stats.remaining_budget < 0 ? 'danger' : 'success'}`}>
                                            {formatPrice(stats.remaining_budget)}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Filters Bar (Global) */}
                            <div className="filters-bar">
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    title="Boshlanish sanasi"
                                />
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    title="Tugash sanasi"
                                />
                                {activeTab === 'list' && (
                                    <select
                                        value={filterCategory}
                                        onChange={(e) => setFilterCategory(e.target.value)}
                                    >
                                        <option value="">Barcha kategoriyalar</option>
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                )}
                                <select
                                    value={filterUser}
                                    onChange={(e) => setFilterUser(e.target.value)}
                                >
                                    <option value="">Barcha xodimlar</option>
                                    {users.map(u => (
                                        <option key={u.id} value={u.id}>{u.name}</option>
                                    ))}
                                </select>

                                {(startDate || endDate || filterCategory || filterUser) && (
                                    <button
                                        className="btn-filter-clear"
                                        onClick={() => {
                                            setStartDate('');
                                            setEndDate('');
                                            setFilterCategory('');
                                            setFilterUser('');
                                        }}
                                    >
                                        <CloseIcon style={{ width: 16, height: 16 }} />
                                        Tozalash
                                    </button>
                                )}
                            </div>

                            {/* Content based on Tab */}
                            {activeTab === 'list' ? (
                                <div>


                                    {listLoading ? (
                                        <div className="loading-state"><div className="spinner"></div></div>
                                    ) : expensesList.length === 0 ? (
                                        <div className="empty-state">Xarajatlar topilmadi</div>
                                    ) : (
                                        <>
                                            <div className="responsive-table">
                                                <table className="data-table">
                                                    <thead>
                                                        <tr>
                                                            <th>Sana</th>
                                                            <th>Kategoriya</th>
                                                            <th>Tavsif</th>
                                                            <th>Summa</th>
                                                            <th>Kim tomonidan</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {expensesList.map(item => (
                                                            <tr key={item.id}>
                                                                <td>{item.date}</td>
                                                                <td>
                                                                    {item.category ? (
                                                                        <span className={`status-badge ${item.category_color}`}>
                                                                            {item.category_name}
                                                                        </span>
                                                                    ) : '-'}
                                                                </td>
                                                                <td>{item.description}</td>
                                                                <td style={{ fontWeight: '500' }}>{formatPrice(item.amount)}</td>
                                                                <td>{item.created_by_name || '-'}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>

                                            {/* Pagination Controls for Expenses List */}
                                            {expensesTotalPages > 1 && (
                                                <div className="pagination-container" style={{ marginTop: '20px' }}>
                                                    <div className="pagination-info">
                                                        Sahifa {expensesPage} / {expensesTotalPages}
                                                    </div>
                                                    <div className="pagination-controls">
                                                        <button
                                                            className="pagination-btn"
                                                            onClick={() => setExpensesPage(Math.max(1, expensesPage - 1))}
                                                            disabled={expensesPage === 1}
                                                        >
                                                            <ChevronLeftIcon />
                                                        </button>
                                                        <button className="pagination-btn active">
                                                            {expensesPage}
                                                        </button>
                                                        <button
                                                            className="pagination-btn"
                                                            onClick={() => setExpensesPage(Math.min(expensesTotalPages, expensesPage + 1))}
                                                            disabled={expensesPage === expensesTotalPages}
                                                        >
                                                            <ChevronRightIcon />
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            ) : (
                                <div>
                                    {statsLoading || !stats ? (
                                        <div className="loading-state"><div className="spinner"></div></div>
                                    ) : (
                                        <div className="chart-grid">
                                            {/* 1. Category Distribution */}
                                            <div className="chart-card-refined">
                                                <h3>Kategoriyalar bo'yicha</h3>
                                                <CategoryPieChart data={stats.by_category} />
                                            </div>

                                            {/* 2. Monthly Dynamics */}
                                            <div className="chart-card-refined">
                                                <h3>Oylik dinamika</h3>
                                                <MonthlyBarChart data={stats.monthly_dynamics} />
                                            </div>

                                            {/* 3. 30 Days Trend */}
                                            <div className="chart-card-refined">
                                                <h3>So'nggi 30 kun</h3>
                                                <DailyAreaChart data={stats.daily_trend} />
                                            </div>

                                            {/* 4. User Contribution */}
                                            <div className="chart-card-refined">
                                                <h3>Foydalanuvchilar ulushi</h3>
                                                <UserBarChart data={stats.user_contribution} />
                                            </div>

                                            {/* 5. Average Cost per Category */}
                                            <div className="chart-card-refined">
                                                <h3>O'rtacha xarajat (Kategoriya)</h3>
                                                <ResponsiveContainer width="100%" height={300}>
                                                    <BarChart data={stats.by_category}>
                                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} opacity={0.5} />
                                                        <XAxis
                                                            dataKey="category__name"
                                                            tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }}
                                                            axisLine={{ stroke: 'var(--border-color)' }}
                                                            tickLine={false}
                                                        />
                                                        <YAxis
                                                            tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }}
                                                            axisLine={false}
                                                            tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
                                                            tickLine={false}
                                                        />
                                                        <Tooltip content={<CustomTooltip formatter={formatPrice} />} />
                                                        <Bar dataKey="total" name="Jami" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={30} />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>

                                            {/* 6. Budget Consumption */}
                                            <div className="chart-card-refined">
                                                <h3>Byudjet bajarilishi</h3>
                                                <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                                                    <ResponsiveContainer width="100%" height={300}>
                                                        <PieChart>
                                                            <Pie
                                                                data={[
                                                                    { name: "Sarflangan", value: parseFloat(stats.spent_amount) },
                                                                    { name: "Qolgan", value: Math.max(0, parseFloat(stats.remaining_budget)) }
                                                                ]}
                                                                cx="50%"
                                                                cy="50%"
                                                                innerRadius={60}
                                                                outerRadius={100}
                                                                fill="#8884d8"
                                                                dataKey="value"
                                                                stroke="none"
                                                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                                            >
                                                                <Cell fill="#ef4444" />
                                                                <Cell fill="#10b981" />
                                                            </Pie>
                                                            <Tooltip content={<CustomTooltip formatter={formatPrice} />} />
                                                            <Legend iconType="circle" wrapperStyle={{ paddingTop: 10, fontSize: 12, color: 'var(--text-secondary)' }} />
                                                        </PieChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
};

export default BuildingExpenses;
