import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { analyticsService } from '../services/analytics';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, AreaChart, Area, Legend
} from 'recharts';
import './Dashboard.css';

const Dashboard = () => {
    const { user } = useAuth();
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSummary();
    }, []);

    const fetchSummary = async () => {
        try {
            const res = await analyticsService.getSummary();
            setSummary(res.data);
        } catch (error) {
            console.error("Dashboard stats error:", error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('uz-UZ').format(val) + " so'm";
    };

    const stats = [
        { label: 'Binolar', value: summary?.buildings_count || '0', color: 'primary', icon: 'building' },
        { label: 'Uylar', value: summary?.homes_count || '0', color: 'success', icon: 'home' },
        { label: 'Mijozlar', value: summary?.clients_count || '0', color: 'warning', icon: 'users' },
        { label: 'Shartnomalar', value: summary?.contracts_count || '0', color: 'cyan', icon: 'contract' },
    ];

    const revenueStats = [
        { label: 'Bugungi tushum', value: summary?.revenue?.daily || 0, color: 'success' },
        { label: 'Haftalik tushum', value: summary?.revenue?.weekly || 0, color: 'primary' },
        { label: 'Oylik tushum', value: summary?.revenue?.monthly || 0, color: 'info' },
        { label: 'Umumiy qarzlar', value: summary?.revenue?.total_debt || 0, color: 'warning' },
    ];

    const CHART_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6'];

    const getDateInfo = () => {
        const date = new Date();
        const weekdays = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];
        const months = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];
        return {
            weekday: weekdays[date.getDay()],
            formatted: `${date.getDate()}-${months[date.getMonth()]} ${date.getFullYear()}`
        };
    };

    const dateInfo = getDateInfo();

    if (loading && !summary) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Ma'lumotlar yuklanmoqda...</p>
            </div>
        );
    }

    return (
        <div className="dashboard-content">
            <header className="dashboard-header">
                <div className="header-info">
                    <p className="greeting">Xush kelibsiz,</p>
                    <h1 className="title">
                        {user?.first_name || user?.username || 'Admin'} <span>👋</span>
                    </h1>
                </div>
                <div className="date-box">
                    <CalendarIcon />
                    <div>
                        <span className="date-label">{dateInfo.weekday}</span>
                        <span className="date-value">{dateInfo.formatted}</span>
                    </div>
                </div>
            </header>

            {/* Counts Section */}
            <section className="stats-grid">
                {stats.map((stat) => (
                    <div key={stat.label} className={`stat-card stat-${stat.color}`}>
                        <div className="stat-icon">
                            <StatIcon type={stat.icon} />
                        </div>
                        <div className="stat-info-box">
                            <span className="stat-value">{stat.value}</span>
                            <span className="stat-label">{stat.label}</span>
                        </div>
                    </div>
                ))}
            </section>

            {/* Revenue Overview Section */}
            <div className="section-title">Moliyaviy ko'rsatkichlar</div>
            <section className="revenue-grid">
                {revenueStats.map((item) => {
                    const totalVal = summary?.revenue?.total_sales_value || 1;
                    const realPercentage = (item.value / totalVal) * 100;
                    const displayPercentage = Math.min(100, Math.max(2, realPercentage));
                    const isDebt = item.label === 'Umumiy qarzlar';

                    return (
                        <div key={item.label} className={`revenue-card rev-${item.color}`}>
                            <span className="revenue-label">{item.label}</span>
                            <span className="revenue-value">{formatCurrency(item.value)}</span>
                            <div className="revenue-chart-mini">
                                <div className="mini-bar-container">
                                    <div
                                        className="mini-bar"
                                        style={{ width: `${displayPercentage}%` }}
                                    ></div>
                                </div>
                                <div className="revenue-footer">
                                    <span className="footer-target">
                                        {isDebt
                                            ? `To'langan: ${formatCurrency(totalVal - item.value)}`
                                            : `Jami: ${formatCurrency(totalVal)}`}
                                    </span>
                                    <span className="footer-percent">
                                        {isDebt ? `${realPercentage.toFixed(1)}% to'lanmagan` : `${realPercentage.toFixed(1)}%`}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </section>

            {/* Charts Section */}
            <section className="charts-grid-layout">
                {/* Building Occupancy */}
                <div className="chart-card">
                    <div className="chart-header">
                        <h3>Bino bandligi (Sotilgan / Jami)</h3>
                    </div>
                    <div className="chart-container">
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={summary?.building_occupancy || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} unit="%" />
                                <Tooltip
                                    contentStyle={{
                                        background: 'var(--bg-secondary)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '12px',
                                        fontSize: '12px',
                                        color: 'var(--text-primary)',
                                        boxShadow: 'var(--shadow-lg)'
                                    }}
                                    itemStyle={{ color: 'var(--text-primary)' }}
                                    cursor={{ fill: 'var(--bg-tertiary)', opacity: 0.4 }}
                                    formatter={(value, name, props) => {
                                        const { sold, total } = props.payload;
                                        return [`${value}% (${sold}/${total})`, "Sotilgan"];
                                    }}
                                />
                                <Bar dataKey="percentage" fill="var(--accent-primary)" radius={[4, 4, 0, 0]} barSize={32} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Weekly Trend */}
                <div className="chart-card">
                    <div className="chart-header">
                        <h3>Haftalik mijozlar o'sishi</h3>
                    </div>
                    <div className="chart-container">
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={summary?.weekly_trend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                                <Tooltip
                                    contentStyle={{
                                        background: 'var(--bg-secondary)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '12px',
                                        fontSize: '12px',
                                        color: 'var(--text-primary)',
                                        boxShadow: 'var(--shadow-lg)'
                                    }}
                                    itemStyle={{ color: 'var(--text-primary)' }}
                                    labelFormatter={(label) => `Sana: ${label}`}
                                    formatter={(value) => [value, "Mijozlar soni"]}
                                />
                                <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorTrend)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Lead Sources */}
                <div className="chart-card">
                    <div className="chart-header">
                        <h3>Mijozlar qayerdan eshitgan</h3>
                    </div>
                    <div className="chart-container pie-chart-container">
                        <ResponsiveContainer width="100%" height={220}>
                            <PieChart>
                                <Pie
                                    data={summary?.lead_sources || []}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="count"
                                    nameKey="heard_source"
                                    stroke="none"
                                >
                                    {(summary?.lead_sources || []).map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    wrapperStyle={{ zIndex: 1000 }}
                                    contentStyle={{
                                        background: 'rgba(30, 41, 59, 0.95)',
                                        border: '1px solid rgba(148, 163, 184, 0.2)',
                                        borderRadius: '12px',
                                        fontSize: '12px',
                                        color: '#f1f5f9',
                                        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
                                        padding: '10px 14px'
                                    }}
                                    itemStyle={{ color: '#f1f5f9' }}
                                    formatter={(value, name, props) => {
                                        return [value, `${props.payload.heard_source}:`];
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    {/* Custom Legend */}
                    <div className="custom-pie-legend">
                        {(summary?.lead_sources || []).map((item, index) => (
                            <div key={index} className="legend-item">
                                <span
                                    className="legend-dot"
                                    style={{ background: CHART_COLORS[index % CHART_COLORS.length] }}
                                ></span>
                                <span className="legend-text">{item.heard_source}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Debtors Chart */}
                <div className="chart-card">
                    <div className="chart-header">
                        <h3>Eng ko'p qarzdorlar</h3>
                    </div>
                    <div className="chart-container">
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart
                                data={summary?.debtors || []}
                                layout="vertical"
                                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey="client"
                                    type="category"
                                    axisLine={false}
                                    tickLine={false}
                                    width={100}
                                    tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                                />
                                <Tooltip
                                    contentStyle={{
                                        background: 'var(--bg-secondary)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '12px',
                                        fontSize: '12px',
                                        color: 'var(--text-primary)',
                                        boxShadow: 'var(--shadow-lg)'
                                    }}
                                    itemStyle={{ color: 'var(--text-primary)' }}
                                    formatter={(value) => [formatCurrency(value), "Qarz miqdori"]}
                                />
                                <Bar dataKey="amount" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </section>

            {/* Expenses Section */}
            <div className="section-title">Chiqimlar tahlili</div>
            <section className="charts-grid-layout charts-three-col">
                {/* Daily Expenses Trend */}
                <div className="chart-card">
                    <div className="chart-header">
                        <h3>Kunlik chiqimlar trendi</h3>
                    </div>
                    <div className="chart-container">
                        <ResponsiveContainer width="100%" height={250}>
                            <AreaChart data={summary?.expenses?.daily_trend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorExpTrend" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                                <Tooltip
                                    contentStyle={{
                                        background: 'var(--bg-secondary)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '12px',
                                        fontSize: '12px',
                                        color: 'var(--text-primary)',
                                        boxShadow: 'var(--shadow-lg)'
                                    }}
                                    itemStyle={{ color: 'var(--text-primary)' }}
                                    formatter={(value) => [formatCurrency(value), "Chiqim"]}
                                />
                                <Area type="monotone" dataKey="amount" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorExpTrend)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Expenses by Category */}
                <div className="chart-card">
                    <div className="chart-header">
                        <h3>Xarajat turlari</h3>
                    </div>
                    <div className="chart-container pie-chart-container">
                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie
                                    data={summary?.expenses?.by_category || []}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={40}
                                    outerRadius={65}
                                    paddingAngle={5}
                                    dataKey="value"
                                    nameKey="name"
                                    stroke="none"
                                >
                                    {(summary?.expenses?.by_category || []).map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    wrapperStyle={{ zIndex: 1000 }}
                                    contentStyle={{
                                        background: 'rgba(30, 41, 59, 0.95)',
                                        border: '1px solid rgba(148, 163, 184, 0.2)',
                                        borderRadius: '12px',
                                        fontSize: '12px',
                                        color: '#f1f5f9',
                                        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
                                        padding: '10px 14px'
                                    }}
                                    itemStyle={{ color: '#f1f5f9' }}
                                    formatter={(value, name) => [formatCurrency(value), `${name}:`]}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    {/* Custom Legend */}
                    <div className="custom-pie-legend">
                        {(summary?.expenses?.by_category || []).map((item, index) => (
                            <div key={index} className="legend-item">
                                <span
                                    className="legend-dot"
                                    style={{ background: CHART_COLORS[index % CHART_COLORS.length] }}
                                ></span>
                                <span className="legend-text">{item.name}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Expenses by Building */}
                <div className="chart-card">
                    <div className="chart-header">
                        <h3>Binolar bo'yicha chiqimlar</h3>
                    </div>
                    <div className="chart-container">
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={summary?.expenses?.by_building || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                                <Tooltip
                                    contentStyle={{
                                        background: 'var(--bg-secondary)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '12px',
                                        fontSize: '12px',
                                        color: 'var(--text-primary)',
                                        boxShadow: 'var(--shadow-lg)'
                                    }}
                                    itemStyle={{ color: 'var(--text-primary)' }}
                                    formatter={(value) => [formatCurrency(value), "Jami chiqim"]}
                                />
                                <Bar dataKey="value" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={32} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </section>
        </div>
    );
};

// Icons
const CalendarIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>;
const CheckIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>;
const StatIcon = ({ type }) => {
    if (type === 'building') return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="2" width="16" height="20" rx="2" /><path d="M9 22v-4h6v4" /></svg>;
    if (type === 'home') return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12l9-9 9 9" /><path d="M5 10v10a1 1 0 001 1h12a1 1 0 001-1V10" /></svg>;
    if (type === 'users') return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>;
    return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>;
};

export default Dashboard;
