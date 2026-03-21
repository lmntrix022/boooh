import React from 'react';
import {
    LineChart,
    Line,
    BarChart as RechartsBarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';
import { useLanguage } from "@/hooks/useLanguage";

const COLORS = ['#1F2937', '#374151', '#4B5563', '#6B7280', '#9CA3AF', '#D1D5DB'];

interface ChartSeries {
    key: string;
    name: string;
    stroke?: string;
    fill?: string;
    yAxisId?: string;
    type?: 'monotone' | 'linear' | 'step';
}

interface StatsChartsProps {
    type: 'line' | 'pie' | 'bar';
    data: any[];
    config?: {
        unit?: string;
        label?: string;
        categoryLabel?: string;
        series?: ChartSeries[];
        layout?: 'horizontal' | 'vertical';
        xAxisKey?: string;
        xAxisTickFormatter?: (value: any) => string;
        tooltipLabelFormatter?: (value: any) => string;
        yAxes?: { id: string; orientation?: 'left' | 'right' }[];
    };
}

export const StatsCharts: React.FC<StatsChartsProps> = ({ type, data, config }) => {
    const { t } = useLanguage();

    if (type === 'line') {
        return (
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <defs>
                        <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#111827" stopOpacity={0.7} />
                            <stop offset="95%" stopColor="#111827" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} stroke="#E5E7EB" />
                    <XAxis
                        dataKey={config?.xAxisKey || "date"}
                        tick={{ fontSize: 12, fill: '#6B7280', fontWeight: 300 }}
                        tickMargin={10}
                        tickFormatter={config?.xAxisTickFormatter}
                    />
                    {config?.yAxes ? (
                        config.yAxes.map(axis => (
                            <YAxis
                                key={axis.id}
                                yAxisId={axis.id}
                                orientation={axis.orientation}
                                tick={{ fontSize: 12, fill: '#6B7280', fontWeight: 300 }}
                            />
                        ))
                    ) : (
                        <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#6B7280', fontWeight: 300 }} tickMargin={10} />
                    )}
                    <Tooltip
                        contentStyle={{ background: 'rgba(255,255,255,0.98)', borderRadius: 8, border: '1px solid rgba(229,231,235,0.8)', boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)' }}
                        labelStyle={{ color: '#111827', fontWeight: 300, fontSize: 14 }}
                        itemStyle={{ color: '#111827', fontWeight: 300 }}
                        labelFormatter={config?.tooltipLabelFormatter}
                    />
                    <Legend wrapperStyle={{ fontWeight: 300 }} />
                    {config?.series ? (
                        config.series.map(s => (
                            <Line
                                key={s.key}
                                yAxisId={s.yAxisId}
                                type={s.type || "monotone"}
                                dataKey={s.key}
                                name={s.name}
                                stroke={s.stroke || "#111827"}
                                strokeWidth={2}
                                dot={{ r: 4 }}
                                activeDot={{ r: 6 }}
                            />
                        ))
                    ) : (
                        <Line type="monotone" dataKey="views" name={t('stats.views') || 'Vues'} stroke="#111827" strokeWidth={3} dot={{ r: 5, fill: '#111827', stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 8 }} fill="url(#colorViews)" />
                    )}
                </LineChart>
            </ResponsiveContainer>
        );
    }

    if (type === 'pie') {
        return (
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#111827"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                    >
                        {data.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip
                        formatter={(value) => [`${value} ${config?.unit || t('stats.views') || 'vues'}`, config?.label || t('stats.views') || 'Vues']}
                        labelFormatter={(label) => `${config?.categoryLabel || t('stats.device') || 'Appareil'}: ${label}`}
                        contentStyle={{ background: 'rgba(255,255,255,0.98)', borderRadius: 8, border: '1px solid rgba(229,231,235,0.8)', boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)' }}
                        itemStyle={{ color: '#111827', fontWeight: 300 }}
                    />
                    <Legend wrapperStyle={{ fontWeight: 300 }} />
                </PieChart>
            </ResponsiveContainer>
        );
    }

    if (type === 'bar') {
        return (
            <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart
                    data={data}
                    layout={config?.layout || 'horizontal'}
                    margin={{ top: 20, right: 30, left: config?.layout === 'vertical' ? 60 : 20, bottom: 5 }}
                >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} stroke="#E5E7EB" />
                    <XAxis
                        type={config?.layout === 'vertical' ? "number" : "category"}
                        dataKey={config?.layout === 'vertical' ? undefined : config?.xAxisKey || "name"}
                        tick={{ fontSize: 12, fill: '#6B7280', fontWeight: 300 }}
                        tickFormatter={config?.xAxisTickFormatter}
                    />
                    <YAxis
                        type={config?.layout === 'vertical' ? "category" : "number"}
                        dataKey={config?.layout === 'vertical' ? config?.xAxisKey || "name" : undefined}
                        tick={{ fontSize: 12, fill: '#6B7280', fontWeight: 300 }}
                        width={config?.layout === 'vertical' ? 100 : undefined}
                    />
                    <Tooltip
                        contentStyle={{ background: 'rgba(255,255,255,0.98)', borderRadius: 8, border: '1px solid rgba(229,231,235,0.8)', boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)' }}
                        itemStyle={{ color: '#111827', fontWeight: 300 }}
                    />
                    <Legend wrapperStyle={{ fontWeight: 300 }} />
                    {config?.series ? (
                        config.series.map(s => (
                            <Bar
                                key={s.key}
                                dataKey={s.key}
                                name={s.name}
                                fill={s.fill || "#111827"}
                                barSize={25}
                                radius={config?.layout === 'vertical' ? [0, 8, 8, 0] : [8, 8, 0, 0]}
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill || s.fill || COLORS[index % COLORS.length]} />
                                ))}
                            </Bar>
                        ))
                    ) : (
                        <Bar dataKey="value" name={config?.label || t('stats.views')} fill="#111827" barSize={25} radius={config?.layout === 'vertical' ? [0, 8, 8, 0] : [8, 8, 0, 0]} />
                    )}
                </RechartsBarChart>
            </ResponsiveContainer>
        );
    }

    return null;
};

export default StatsCharts;
