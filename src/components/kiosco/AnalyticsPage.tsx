import React, { useState, useEffect } from 'react';
import { useToast } from '../../contexts/ToastContext';
import { supabase } from '../../lib/supabase';
import { TrendingUp, DollarSign, Package, Clock } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export const AnalyticsPage: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'day' | 'week' | 'month'>('day');
  const { addToast } = useToast();

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      const { data: orders, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            quantity,
            unit_price,
            products (name)
          )
        `)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading analytics:', error);
        addToast('Error al cargar análisis', 'error');
        return;
      }

      if (orders) {
        setOrders(orders);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
      addToast('Error al cargar análisis', 'error');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return `$${price.toLocaleString()}`;
  };

  // Prepare data for trends chart
  const prepareTrendsData = () => {
    const dailyData: { [key: string]: { orders: number; revenue: number; date: string } } = {};
    
    orders.forEach(order => {
      const dateObj = new Date(order.created_at);
      const date = dateObj.toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit'
      });
      const sortKey = dateObj.toISOString().split('T')[0]; // YYYY-MM-DD for sorting
      
      if (!dailyData[date]) {
        dailyData[date] = { orders: 0, revenue: 0, date: sortKey };
      }
      dailyData[date].orders += 1;
      dailyData[date].revenue += order.total_amount;
    });

    return Object.entries(dailyData)
      .map(([displayDate, data]) => ({
        date: displayDate,
        orders: data.orders,
        revenue: data.revenue,
        sortKey: data.date
      }))
      .sort((a, b) => new Date(a.sortKey).getTime() - new Date(b.sortKey).getTime())
      .slice(-7); // Last 7 days
  };

  // Calculate metrics
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  
  // Product sales analysis
  const productSales = orders.reduce((acc, order) => {
    order.order_items?.forEach((item: any) => {
      const productName = item.products?.name;
      if (!acc[productName]) {
        acc[productName] = { quantity: 0, revenue: 0 };
      }
      acc[productName].quantity += item.quantity;
      acc[productName].revenue += item.unit_price * item.quantity;
    });
    return acc;
  }, {} as Record<string, { quantity: number; revenue: number }>);

  const topProducts = Object.entries(productSales)
    .sort(([,a], [,b]) => b.quantity - a.quantity)
    .slice(0, 5);

  // Time analysis
  const timeAnalysis = orders.reduce((acc, order) => {
    const time = order.scheduled_time;
    if (!acc[time]) {
      acc[time] = { orders: 0, revenue: 0 };
    }
    acc[time].orders += 1;
    acc[time].revenue += order.total_amount;
    return acc;
  }, {} as Record<string, { orders: number; revenue: number }>);

  const trendsData = prepareTrendsData();

  const MetricCard: React.FC<{
    title: string;
    value: string;
    icon: React.ReactNode;
    color: string;
  }> = ({ title, value, icon, color }) => (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center">
        <div className={`flex-shrink-0 p-3 ${color} rounded-lg`}>
          {icon}
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="ml-64 min-h-screen bg-cream-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando análisis...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ml-64 min-h-screen bg-cream-50">
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Analytics</h1>
          <p className="text-gray-600">Análisis de ventas y rendimiento del kiosco</p>
        </div>

        {/* Period Filter */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700">Período:</span>
            <div className="flex space-x-2">
              {['day', 'week', 'month'].map((period) => (
                <button
                  key={period}
                  onClick={() => setSelectedPeriod(period as any)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    selectedPeriod === period
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {period === 'day' ? 'Hoy' : period === 'week' ? 'Semana' : 'Mes'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Total de Pedidos"
            value={totalOrders.toString()}
            icon={<Package className="h-6 w-6 text-white" />}
            color="bg-blue-600"
          />
          <MetricCard
            title="Ingresos Totales"
            value={formatPrice(totalRevenue)}
            icon={<DollarSign className="h-6 w-6 text-white" />}
            color="bg-green-600"
          />
          <MetricCard
            title="Valor Promedio"
            value={formatPrice(averageOrderValue)}
            icon={<TrendingUp className="h-6 w-6 text-white" />}
            color="bg-purple-600"
          />
          <MetricCard
            title="Pedidos Activos"
            value={orders.filter(o => ['pendiente', 'en_preparacion', 'listo'].includes(o.status)).length.toString()}
            icon={<Clock className="h-6 w-6 text-white" />}
            color="bg-orange-600"
          />
        </div>

        {/* Trends Chart */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tendencia de Ventas (Últimos 7 días)</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis yAxisId="orders" orientation="left" />
                <YAxis yAxisId="revenue" orientation="right" />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'orders' ? value : formatPrice(Number(value)),
                    name === 'orders' ? 'Pedidos' : 'Ingresos'
                  ]}
                  labelFormatter={(label) => `Fecha: ${label}`}
                />
                <Line 
                  yAxisId="orders"
                  type="monotone" 
                  dataKey="orders" 
                  stroke="#3B82F6" 
                  strokeWidth={3}
                  dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                  name="orders"
                />
                <Line 
                  yAxisId="revenue"
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#10B981" 
                  strokeWidth={3}
                  dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                  name="revenue"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center mt-4 space-x-6">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-blue-500 rounded mr-2"></div>
              <span className="text-sm text-gray-600">Pedidos</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
              <span className="text-sm text-gray-600">Ingresos</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Products */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Productos Más Vendidos</h3>
            <div className="space-y-4">
              {topProducts.map(([productName, data], index) => (
                <div key={productName} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="flex items-center justify-center w-8 h-8 bg-primary-100 text-primary-600 rounded-full text-sm font-medium mr-3">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-medium text-gray-900">{productName}</p>
                      <p className="text-sm text-gray-600">{data.quantity} unidades</p>
                    </div>
                  </div>
                  <span className="font-medium text-primary-600">
                    {formatPrice(data.revenue)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Time Analysis */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Ventas por Horario</h3>
            <div className="space-y-4">
              {Object.entries(timeAnalysis)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([time, data]) => (
                <div key={time} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="flex items-center justify-center w-12 h-8 bg-blue-100 text-blue-600 rounded text-sm font-medium mr-3">
                      {time}
                    </span>
                    <div>
                      <p className="font-medium text-gray-900">{data.orders} pedidos</p>
                    </div>
                  </div>
                  <span className="font-medium text-blue-600">
                    {formatPrice(data.revenue)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};