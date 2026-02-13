import React, { useState, useEffect } from 'react';
import {
    AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, ComposedChart
} from 'recharts';
import {
    TrendingUp, Users, DollarSign, Calendar, MapPin, Building, Filter, Phone, UserCheck
} from 'lucide-react';
import { analyticsService } from '../../services/analytics';
import { getAllCities } from '../../services/cities';
import { getAllBuildings } from '../../services/buildings';
import { leadService } from '../../services/leads';
import { toast } from 'sonner';
import './Analytics.css';
import AnalyticsFilterDrawer from './components/AnalyticsFilterDrawer';

// Premium Chart Colors - Gradient inspired
// Premium Chart Colors - Modern & Accessible
const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#8b5cf6', '#ec4899', '#f472b6'];

const GRADIENT_COLORS = {
    indigo: ['#6366f1', '#818cf8'],
    green: ['#10b981', '#34d399'],
    orange: ['#f59e0b', '#fbbf24'],
    red: ['#ef4444', '#f87171'],
    cyan: ['#06b6d4', '#22d3ee'],
    purple: ['#8b5cf6', '#a78bfa'],
    pink: ['#ec4899', '#f472b6']
};

const STATUS_LABELS = {
    'PENDING': 'Kutilmoqda',
    'ACTIVE': 'Faol',
    'COMPLETED': 'Yakunlangan',
    'CANCELLED': 'Bekor qilingan',
    'answered': 'Javob berildi',
    'not_answered': 'Javob berilmadi',
    'client_answered': 'Mijoz javob berdi',
    'client_not_answered': 'Mijoz javob bermadi'
};

const CustomTooltip = ({ active, payload, label, formatter }) => {
    if (active && payload && payload.length) {
        return (
            <div className="custom-tooltip">
                <div className="tooltip-header">{label}</div>
                <div className="tooltip-body">
                    {payload.map((item, index) => (
                        <div key={index} className="tooltip-row">
                            <span className="tooltip-dot" style={{ backgroundColor: item.color }}></span>
                            <span className="tooltip-name">{item.name}:</span>
                            <span className="tooltip-value">
                                {formatter ? formatter(item.value) : item.value}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
    return null;
};

const AnalyticsPage = () => {
    const [activeTab, setActiveTab] = useState('sales');
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    // Sales filters
    const [salesFilters, setSalesFilters] = useState({
        start_date: new Date(new Date().setMonth(new Date().getMonth() - 3)).toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0],
        city: '',
        building: '',
        status: ''
    });

    // Leads filters
    const [leadsFilters, setLeadsFilters] = useState({
        start_date: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0],
        operator: '',
        stage: '',
        call_status: ''
    });

    const [cities, setCities] = useState([]);
    const [buildings, setBuildings] = useState([]);
    const [stages, setStages] = useState([]);
    const [operators, setOperators] = useState([]);

    useEffect(() => {
        loadFilterData();
    }, []);

    useEffect(() => {
        fetchStats();
    }, [activeTab]);

    const loadFilterData = async () => {
        try {
            const [citiesRes, buildingsRes, stagesRes] = await Promise.all([
                getAllCities(),
                getAllBuildings(),
                leadService.getStages().catch(() => [])
            ]);
            // Ensure we always set arrays
            setCities(Array.isArray(citiesRes) ? citiesRes : (citiesRes?.data || citiesRes?.results || []));
            setBuildings(Array.isArray(buildingsRes) ? buildingsRes : (buildingsRes?.data || buildingsRes?.results || []));
            const stagesData = stagesRes?.data || stagesRes?.results || stagesRes;
            setStages(Array.isArray(stagesData) ? stagesData : []);
        } catch (error) {
            console.error('Filtrlarni yuklashda xatolik:', error);
            setCities([]);
            setBuildings([]);
            setStages([]);
        }
    };

    const fetchStats = async () => {
        setLoading(true);
        try {
            const filters = activeTab === 'sales' ? salesFilters : leadsFilters;
            const res = activeTab === 'sales'
                ? await analyticsService.getContractsStats(filters)
                : await analyticsService.getLeadsStats(filters);
            setStats(res.data);

            // Extract operators from leads stats
            if (activeTab === 'leads' && res.data?.leads_by_operator) {
                setOperators(res.data.leads_by_operator.map(o => o.operator_name).filter(Boolean));
            }
        } catch (error) {
            toast.error('Statistikalarni yuklashda xatolik yuz berdi');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (value) => {
        if (!value) return "0 so'm";
        return new Intl.NumberFormat('uz-UZ').format(value) + " UZS";
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        const months = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyun',
            'Iyul', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'];
        return `${date.getDate()}-${months[date.getMonth()]}`;
    };

    // ============== SALES DASHBOARD ==============

    const renderSalesDashboard = () => {
        if (!stats) return null;

        return (
            <div className="analytics-dashboard">
                <div className="charts-grid">
                    {/* 1. Kunlik shartnoma tuzish */}
                    <div className="chart-card">
                        <div className="chart-card-header">
                            <span className="chart-number">Kunlik shartnoma tuzish</span>
                            <h4>Kunlik shartnoma tuzish</h4>
                        </div>
                        <div className="chart-body">
                            <ResponsiveContainer width="100%" height={250} debounce={50}>
                                <AreaChart data={stats.daily_contracts || []}>
                                    <defs>
                                        <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} opacity={0.5} />
                                    <XAxis
                                        dataKey="date"
                                        tickFormatter={formatDate}
                                        tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }}
                                        axisLine={{ stroke: 'var(--border-color)' }}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Area
                                        type="monotone"
                                        dataKey="count"
                                        name="Shartnomalar"
                                        stroke="#6366f1"
                                        strokeWidth={3}
                                        fill="url(#colorCount)"
                                        dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }}
                                        activeDot={{ r: 6, strokeWidth: 0 }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* 2. Shartnomalar holati bo'yicha */}
                    <div className="chart-card">
                        <div className="chart-card-header">
                            <span className="chart-number">Shartnomalar holati bo'yicha</span>
                            <h4>Shartnomalar holati bo'yicha</h4>
                        </div>
                        <div className="chart-body">
                            <ResponsiveContainer width="100%" height={250} debounce={50}>
                                <PieChart>
                                    <Pie
                                        data={(stats.status_distribution || []).map(d => ({
                                            ...d,
                                            name: STATUS_LABELS[d.status] || d.status
                                        }))}
                                        dataKey="count"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        stroke="none"
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        labelLine={{ stroke: 'var(--border-color)' }}
                                    >
                                        {(stats.status_distribution || []).map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend iconType="circle" wrapperStyle={{ paddingTop: 10, fontSize: 12, color: 'var(--text-secondary)' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* 3. Vaqt o'tishi bilan umumiy daromad */}
                    <div className="chart-card">
                        <div className="chart-card-header">
                            <span className="chart-number">Vaqt o'tishi bilan umumiy daromad</span>
                            <h4>Vaqt o'tishi bilan umumiy daromad</h4>
                        </div>
                        <div className="chart-body">
                            <ResponsiveContainer width="100%" height={250} debounce={50}>
                                <AreaChart data={stats.revenue_over_time || []}>
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} opacity={0.5} />
                                    <XAxis
                                        dataKey="date"
                                        tickFormatter={formatDate}
                                        tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }}
                                        axisLine={{ stroke: 'var(--border-color)' }}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`}
                                        tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <Tooltip content={<CustomTooltip formatter={formatCurrency} />} />
                                    <Area
                                        type="monotone"
                                        dataKey="revenue"
                                        name="Daromad"
                                        stroke="#10b981"
                                        fill="url(#colorRevenue)"
                                        strokeWidth={3}
                                        dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                                        activeDot={{ r: 6, strokeWidth: 0 }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* 4. Shaharlar bo'yicha daromad */}
                    <div className="chart-card">
                        <div className="chart-card-header">
                            <span className="chart-number">Shaharlar bo'yicha daromad</span>
                            <h4>Shaharlar bo'yicha daromad</h4>
                        </div>
                        <div className="chart-body">
                            <ResponsiveContainer width="100%" height={250} debounce={50}>
                                <BarChart data={stats.revenue_by_city || []} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" horizontal={false} opacity={0.5} />
                                    <XAxis
                                        type="number"
                                        tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`}
                                        tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        dataKey="city_name"
                                        type="category"
                                        width={100}
                                        tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }}
                                        axisLine={{ stroke: 'var(--border-color)' }}
                                        tickLine={false}
                                    />
                                    <Tooltip content={<CustomTooltip formatter={formatCurrency} />} />
                                    <Bar dataKey="revenue" name="Daromad" fill="#f59e0b" radius={[0, 4, 4, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* 5. Binolar bo'yicha daromad */}
                    <div className="chart-card">
                        <div className="chart-card-header">
                            <span className="chart-number">Binolar bo'yicha daromad</span>
                            <h4>Binolar bo'yicha daromad</h4>
                        </div>
                        <div className="chart-body">
                            <ResponsiveContainer width="100%" height={250} debounce={50}>
                                <BarChart data={(stats.revenue_by_building || []).slice(0, 6)}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} opacity={0.5} />
                                    <XAxis
                                        dataKey="building_name"
                                        tick={{ fill: 'var(--text-tertiary)', fontSize: 10 }}
                                        axisLine={{ stroke: 'var(--border-color)' }}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`}
                                        tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <Tooltip content={<CustomTooltip formatter={formatCurrency} />} />
                                    <Bar dataKey="revenue" name="Daromad" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={30} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* 6. Qarzdorlik holati */}
                    <div className="chart-card">
                        <div className="chart-card-header">
                            <span className="chart-number">Qarzdorlik holati</span>
                            <h4>Qarzdorlik holati</h4>
                        </div>
                        <div className="chart-body">
                            <ResponsiveContainer width="100%" height={250} debounce={50}>
                                <PieChart>
                                    <Pie
                                        data={[
                                            { name: 'Qarzdor emas', value: stats.debt_stats?.non_debtors_count || 0 },
                                            { name: 'Qarzdor', value: stats.debt_stats?.debtors_count || 0 }
                                        ]}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        stroke="none"
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        labelLine={{ stroke: 'var(--border-color)' }}
                                    >
                                        <Cell fill="#06b6d4" />
                                        <Cell fill="#8b5cf6" />
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend iconType="circle" wrapperStyle={{ paddingTop: 10, fontSize: 12, color: 'var(--text-secondary)' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* 7. Binolar bo'yicha sotilgan uylar (batafsil) */}
                    <div className="chart-card wide">
                        <div className="chart-card-header">
                            <span className="chart-number">Binolar bo'yicha sotilgan uylar (batafsil)</span>
                            <h4>Binolar bo'yicha sotilgan uylar</h4>
                        </div>
                        <div className="chart-body">
                            <ResponsiveContainer width="100%" height={300}>
                                <ComposedChart data={stats.homes_by_building || []}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} opacity={0.5} />
                                    <XAxis
                                        dataKey="building_name"
                                        tick={{ fill: 'var(--text-tertiary)', fontSize: 10 }}
                                        axisLine={{ stroke: 'var(--border-color)' }}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        yAxisId="left"
                                        tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        yAxisId="right"
                                        orientation="right"
                                        tickFormatter={(v) => `${v}%`}
                                        tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend iconType="rect" wrapperStyle={{ paddingTop: 10, fontSize: 12, color: 'var(--text-secondary)' }} />
                                    <Bar yAxisId="left" dataKey="sold" name="Sotilgan" stackId="a" fill="#6366f1" radius={[0, 0, 0, 0]} />
                                    <Bar yAxisId="left" dataKey="available" name="Sotilmagan" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} />
                                    <Line yAxisId="right" type="monotone" dataKey="percentage" name="Sotilish foizi" stroke="#ef4444" strokeWidth={3} dot={{ r: 4, fill: '#ef4444', strokeWidth: 2, stroke: '#fff' }} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // ============== LEADS DASHBOARD ==============

    const renderLeadsDashboard = () => {
        if (!stats) return null;

        return (
            <div className="analytics-dashboard">
                <div className="charts-grid">
                    {/* 1. Kunlik qo'shilgan Leadlar soni */}
                    <div className="chart-card">
                        <div className="chart-card-header">
                            <span className="chart-number">1. Kunlik qo'shilgan Leadlar soni</span>
                            <h4>Kunlik qo'shilgan Leadlar soni</h4>
                        </div>
                        <div className="chart-body">
                            <ResponsiveContainer width="100%" height={250} debounce={50}>
                                <AreaChart data={stats.daily_leads || []}>
                                    <defs>
                                        <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} opacity={0.5} />
                                    <XAxis
                                        dataKey="date"
                                        tickFormatter={formatDate}
                                        tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }}
                                        axisLine={{ stroke: 'var(--border-color)' }}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Area
                                        type="monotone"
                                        dataKey="count"
                                        name="Leadlar"
                                        stroke="#6366f1"
                                        strokeWidth={3}
                                        fill="url(#colorLeads)"
                                        dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* 2. Operatorlar bo'yicha Leadlar soni */}
                    <div className="chart-card">
                        <div className="chart-card-header">
                            <span className="chart-number">2. Operatorlar bo'yicha Leadlar soni</span>
                            <h4>Operatorlar bo'yicha Leadlar soni</h4>
                        </div>
                        <div className="chart-body">
                            <ResponsiveContainer width="100%" height={250} debounce={50}>
                                <BarChart data={stats.leads_by_operator || []} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" horizontal={false} opacity={0.5} />
                                    <XAxis
                                        type="number"
                                        tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        dataKey="operator_name"
                                        type="category"
                                        width={100}
                                        tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }}
                                        axisLine={{ stroke: 'var(--border-color)' }}
                                        tickLine={false}
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar dataKey="count" name="Leadlar" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* 3. Leadlar bosqichlar bo'yicha taqsimoti */}
                    <div className="chart-card">
                        <div className="chart-card-header">
                            <span className="chart-number">3. Leadlar bosqichlar bo'yicha taqsimoti</span>
                            <h4>Leadlar bosqichlar bo'yicha taqsimoti</h4>
                        </div>
                        <div className="chart-body">
                            <ResponsiveContainer width="100%" height={250} debounce={50}>
                                <PieChart>
                                    <Pie
                                        data={(stats.stage_distribution || []).filter(d => d.stage_name)}
                                        dataKey="count"
                                        nameKey="stage_name"
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        stroke="none"
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        labelLine={{ stroke: 'var(--border-color)' }}
                                    >
                                        {(stats.stage_distribution || []).map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.stage_color || COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend iconType="circle" wrapperStyle={{ paddingTop: 10, fontSize: 12, color: 'var(--text-secondary)' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* 4. Qo'ng'iroq holati bo'yicha Leadlar */}
                    <div className="chart-card">
                        <div className="chart-card-header">
                            <span className="chart-number">4. Qo'ng'iroq holati bo'yicha Leadlar</span>
                            <h4>Qo'ng'iroq holati bo'yicha Leadlar</h4>
                        </div>
                        <div className="chart-body">
                            <ResponsiveContainer width="100%" height={250} debounce={50}>
                                <PieChart>
                                    <Pie
                                        data={(stats.call_status_distribution || []).map(d => ({
                                            ...d,
                                            name: STATUS_LABELS[d.call_status] || d.call_status || 'Noma\'lum'
                                        }))}
                                        dataKey="count"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        stroke="none"
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        labelLine={{ stroke: 'var(--border-color)' }}
                                    >
                                        {(stats.call_status_distribution || []).map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend iconType="circle" wrapperStyle={{ paddingTop: 10, fontSize: 12, color: 'var(--text-secondary)' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* 5. O'rtacha qo'ng'iroq davomiyligi */}
                    <div className="chart-card">
                        <div className="chart-card-header">
                            <span className="chart-number">5. Leaddagi o'rtacha qo'ng'iroq davomiyligi (kunlar bo'yicha)</span>
                            <h4>O'rtacha qo'ng'iroq davomiyligi (sekundda)</h4>
                        </div>
                        <div className="chart-body">
                            <ResponsiveContainer width="100%" height={250} debounce={50}>
                                <LineChart data={stats.avg_duration_trend || []}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} opacity={0.5} />
                                    <XAxis
                                        dataKey="date"
                                        tickFormatter={formatDate}
                                        tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }}
                                        axisLine={{ stroke: 'var(--border-color)' }}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Line
                                        type="monotone"
                                        dataKey="avg_duration"
                                        name="O'rtacha vaqt"
                                        stroke="#f59e0b"
                                        strokeWidth={3}
                                        dot={{ r: 4, fill: '#f59e0b', strokeWidth: 2, stroke: '#fff' }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* 6. Har bir operator bo'yicha qo'ng'iroq holati */}
                    <div className="chart-card">
                        <div className="chart-card-header">
                            <span className="chart-number">6. Har bir operator bo'yicha qo'ng'iroq holati</span>
                            <h4>Har bir operator bo'yicha qo'ng'iroq holati</h4>
                        </div>
                        <div className="chart-body">
                            <ResponsiveContainer width="100%" height={250} debounce={50}>
                                <BarChart data={stats.operator_call_status || []} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" horizontal={false} opacity={0.5} />
                                    <XAxis
                                        type="number"
                                        tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        dataKey="operator_name"
                                        type="category"
                                        width={80}
                                        tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }}
                                        axisLine={{ stroke: 'var(--border-color)' }}
                                        tickLine={false}
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend iconType="circle" wrapperStyle={{ paddingTop: 10, fontSize: 12, color: 'var(--text-secondary)' }} />
                                    <Bar dataKey="answered" name="Javob berilgan" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                                    <Bar dataKey="not_answered" name="Javob berilmagan" stackId="a" fill="#ef4444" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* 7. Bosqichlar bo'yicha joriy Leadlar soni */}
                    <div className="chart-card">
                        <div className="chart-card-header">
                            <span className="chart-number">7. Bosqichlar bo'yicha joriy Leadlar soni</span>
                            <h4>Bosqichlar bo'yicha joriy Leadlar soni</h4>
                        </div>
                        <div className="chart-body">
                            <ResponsiveContainer width="100%" height={250} debounce={50}>
                                <BarChart data={(stats.current_stage_counts || []).filter(d => d.stage_name)} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" horizontal={false} opacity={0.5} />
                                    <XAxis
                                        type="number"
                                        tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        dataKey="stage_name"
                                        type="category"
                                        width={120}
                                        tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }}
                                        axisLine={{ stroke: 'var(--border-color)' }}
                                        tickLine={false}
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar dataKey="count" name="Leadlar" radius={[0, 4, 4, 0]} barSize={15}>
                                        {(stats.current_stage_counts || []).map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.stage_color || COLORS[index % COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* 8. Leadlar oylik tahlili (faoliyat trendi) */}
                    <div className="chart-card">
                        <div className="chart-card-header">
                            <span className="chart-number">8. Leadlar oylik tahlili (faoliyat trendi)</span>
                            <h4>Leadlar oylik tahlili (faoliyat trendi)</h4>
                        </div>
                        <div className="chart-body">
                            <ResponsiveContainer width="100%" height={250} debounce={50}>
                                <AreaChart data={stats.monthly_trend || []}>
                                    <defs>
                                        <linearGradient id="colorMonthly" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} opacity={0.5} />
                                    <XAxis
                                        dataKey="month"
                                        tickFormatter={(d) => {
                                            const date = new Date(d);
                                            const months = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyun',
                                                'Iyul', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'];
                                            return `${months[date.getMonth()]}-${String(date.getFullYear()).slice(-2)}`;
                                        }}
                                        tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }}
                                        axisLine={{ stroke: 'var(--border-color)' }}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Area
                                        type="monotone"
                                        dataKey="count"
                                        name="Leadlar"
                                        stroke="#6366f1"
                                        strokeWidth={3}
                                        fill="url(#colorMonthly)"
                                        dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="analytics-page">
            <div className="analytics-header">
                <div className="header-left">
                    <h1>Analitika & Hisobotlar</h1>
                    <p>Loyihangiz bo'yicha barcha asosiy ko'rsatkichlar</p>
                </div>

                <div className="header-actions">
                    <div className="header-tabs">
                        <button
                            className={`tab-btn ${activeTab === 'sales' ? 'active' : ''}`}
                            onClick={() => setActiveTab('sales')}
                        >
                            <DollarSign size={18} />
                            Sotuvlar
                        </button>
                        <button
                            className={`tab-btn ${activeTab === 'leads' ? 'active' : ''}`}
                            onClick={() => setActiveTab('leads')}
                        >
                            <Users size={18} />
                            Leadlar
                        </button>
                    </div>

                    <div className="header-right">
                        <button
                            className={`btn-filter-trigger ${isFilterOpen ? 'active' : ''}`}
                            onClick={() => setIsFilterOpen(true)}
                        >
                            <Filter size={18} />
                            Filterlash
                        </button>
                    </div>
                </div>
            </div>

            <div className="analytics-content">
                {loading ? (
                    <div className="loading-state">
                        <div className="spinner"></div>
                        <p>Ma'lumotlar yuklanmoqda...</p>
                    </div>
                ) : (
                    <>
                        {activeTab === 'sales' ? renderSalesDashboard() : renderLeadsDashboard()}
                    </>
                )}
            </div>

            <AnalyticsFilterDrawer
                isOpen={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
                activeTab={activeTab}
                initialFilters={activeTab === 'sales' ? salesFilters : leadsFilters}
                cities={cities}
                buildings={buildings}
                stages={stages}
                operators={operators}
                onFilter={(newFilters) => {
                    if (activeTab === 'sales') {
                        setSalesFilters(newFilters);
                    } else {
                        setLeadsFilters(newFilters);
                    }
                    // fetchStats will be triggered by useEffect or manually called
                    setTimeout(() => fetchStats(), 0);
                }}
            />
        </div>
    );
};

export default AnalyticsPage;
