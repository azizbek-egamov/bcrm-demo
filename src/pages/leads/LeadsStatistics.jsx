import React, { useState, useEffect } from 'react';
import { leadService } from '../../services/leads';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';

const LeadsStatistics = () => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({
        total: 0,
        by_stage: [],
        by_status: [],
        by_operator: []
    });

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        setLoading(true);
        try {
            const res = await leadService.getStatistics();
            setData(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-5 text-center text-muted">Yuklanmoqda...</div>;

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

    return (
        <div className="p-4">
            <h4 className="mb-4 text-gray-800 fw-bold">Statistika</h4>

            {/* Summary Cards */}
            <div className="row mb-4">
                <div className="col-md-3">
                    <div className="card border-0 shadow-sm p-3">
                        <div className="d-flex justify-content-between align-items-center">
                            <div>
                                <small className="text-muted text-uppercase fw-bold">Jami Leadlar</small>
                                <h2 className="mb-0 fw-bold text-primary">{data.total}</h2>
                            </div>
                            <div className="bg-primary bg-opacity-10 p-3 rounded-circle text-primary">
                                <i className="bi bi-people-fill fs-4"></i>
                            </div>
                        </div>
                    </div>
                </div>
                {/* Placeholder for future cards like 'Conversion Rate', 'Active Leads' etc */}
            </div>

            <div className="row g-4">
                {/* Stage Distribution */}
                <div className="col-lg-8">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-header bg-white border-0 py-3">
                            <h6 className="mb-0 fw-bold">Bosqichlar kesimida</h6>
                        </div>
                        <div className="card-body" style={{ height: 400 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={data.by_stage}
                                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis fontSize={12} tickLine={false} axisLine={false} />
                                    <RechartsTooltip
                                        cursor={{ fill: '#f8f9fa' }}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    />
                                    <Bar dataKey="count" name="Leadlar soni" radius={[4, 4, 0, 0]}>
                                        {data.by_stage.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill || COLORS[index % COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Status Distribution */}
                <div className="col-lg-4">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-header bg-white border-0 py-3">
                            <h6 className="mb-0 fw-bold">Qo'ng'iroq Statusi</h6>
                        </div>
                        <div className="card-body" style={{ height: 400 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={data.by_status}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="count"
                                    >
                                        {data.by_status.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Operator Performance */}
                <div className="col-12">
                    <div className="card border-0 shadow-sm">
                        <div className="card-header bg-white border-0 py-3">
                            <h6 className="mb-0 fw-bold">Operatorlar Faolligi</h6>
                        </div>
                        <div className="card-body" style={{ height: 350 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={data.by_operator}
                                    layout="vertical"
                                    margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" width={150} tickLine={false} axisLine={false} fontSize={13} />
                                    <RechartsTooltip />
                                    <Bar dataKey="count" name="Leadlar soni" fill="#6366f1" barSize={20} radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LeadsStatistics;
