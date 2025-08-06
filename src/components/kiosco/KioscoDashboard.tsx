import React, { useState, useEffect } from 'react';
import { Order } from '../../types';
import { useToast } from '../../contexts/ToastContext';
import { Clock, Package, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export const KioscoDashboard: React.FC = () => {
  type OrderCycle = 'ciclo_basico' | 'ciclo_superior' | 'kiosquero' | 'admin' | null;

  // Type for product within order items
  interface OrderItemProduct {
    id: string;
    name: string;
    price: number;
    description: string | null;
    image_url: string | null;
    category: string;
    created_at?: string | null;
    updated_at?: string | null;
    is_available?: boolean | null;
    stock_quantity?: number | null;
    ingredients?: string[] | null;
    customizable?: boolean | null;
  }

  // Type for customizations in order items
  type OrderItemCustomizations = Record<string, unknown>;

  interface DatabaseOrderItem {
    id: string;
    order_id: string | null;
    product_id: string | null;
    quantity: number;
    unit_price: number;
    created_at: string | null;
    product: OrderItemProduct | null;
    customizations?: OrderItemCustomizations;
  }

  interface DatabaseOrder {
    id: string;
    user_id: string | null;  // Make user_id nullable to match Supabase schema
    status: Order['status'];
    scheduled_time: string;
    payment_method: 'tarjeta' | 'mercadopago' | 'efectivo';
    user_cycle?: OrderCycle;
    total_amount: number;
    created_at: string | null;  // Make created_at nullable
    updated_at: string | null;  // Make updated_at nullable
    completed_at: string | null;
    order_items: DatabaseOrderItem[];
  }

  const [orders, setOrders] = useState<DatabaseOrder[]>([]);
  const [selectedTime, setSelectedTime] = useState<string>('all');
  const { addToast } = useToast();

  const breakTimes = ['9:35', '11:55', '14:55', '17:15', '19:35'];

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setIsLoading(true);
        const { data: ordersData, error } = await supabase
          .from('orders')
          .select(`
            id,
            user_id,
            status,
            scheduled_time,
            payment_method,
            user_cycle,
            total_amount,
            created_at,
            updated_at,
            completed_at,
            order_items (
              id,
              quantity,
              unit_price,
              customizations,
              product:products(
                id,
                name,
                price,
                description,
                image_url,
                category
              )
            )
          `)
          .order('created_at', { ascending: false })
          .not('user_id', 'is', null); // Ensure user_id is not null

        if (error) throw error;

              // Filter and transform orders to match DatabaseOrder type
        const validOrders: DatabaseOrder[] = [];
        
        (ordersData || []).forEach(order => {
          try {
            // Skip orders with null user_id or invalid user_cycle
            if (!order.user_id || 
                order.user_cycle === 'kiosquero' || 
                order.user_cycle === 'admin' ||
                !order.order_items) {
              return;
            }
            
            // Filter out any order items with null products
            const validOrderItems = order.order_items
              .filter(item => item?.product !== null && item.product !== undefined)
              .map(item => ({
                ...item,
                // Ensure product is not null since we filtered nulls above
                product: item.product!,
                // Ensure customizations is always an object with proper type
                customizations: (item.customizations && typeof item.customizations === 'object' 
                  ? item.customizations 
                  : {}) as Record<string, any>
              }));
            
            // Create a valid order with proper typing
            const validOrder: DatabaseOrder = {
              id: order.id || '',
              user_id: order.user_id,
              status: order.status || 'pendiente',
              scheduled_time: order.scheduled_time || '',
              payment_method: order.payment_method || 'efectivo',
              total_amount: order.total_amount || 0,
              created_at: order.created_at || new Date().toISOString(),
              updated_at: order.updated_at || new Date().toISOString(),
              completed_at: order.completed_at,
              order_items: validOrderItems,
              // Only include user_cycle if it's ciclo_basico or ciclo_superior
              ...((order.user_cycle === 'ciclo_basico' || order.user_cycle === 'ciclo_superior') 
                ? { user_cycle: order.user_cycle }
                : {})
            };
            
            validOrders.push(validOrder);
          } catch (error) {
            console.error('Error processing order:', order.id, error);
          }
        });
        
        setOrders(validOrders);
      } catch (error) {
        console.error('Error fetching orders:', error);
        addToast('Error al cargar las órdenes', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
    
    // Set up real-time subscription
    const ordersSubscription = supabase
      .channel('orders_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'orders' },
        fetchOrders
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ordersSubscription);
    };
  }, []);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const { data: ordersData, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch order items for each order
      const ordersWithItems = await Promise.all(
        (ordersData || []).map(async (order) => {
          const { data: items, error: itemsError } = await supabase
            .from('order_items')
            .select(`
              *,
              product:products(*)
            `)
            .eq('order_id', order.id);

          if (itemsError) throw itemsError;

          // Ensure all required fields are present and properly typed
          const dbOrder: DatabaseOrder = {
            ...order,
            user_cycle: (order.user_cycle as OrderCycle) || null,
            order_items: (items || []).map(item => {
              // Safely handle customizations which might be a string, array, or object
              let customizations: OrderItemCustomizations = {};
              if (item.customizations) {
                try {
                  // If customizations is a string, try to parse it as JSON
                  if (typeof item.customizations === 'string') {
                    customizations = JSON.parse(item.customizations) as OrderItemCustomizations;
                  } 
                  // If it's already an object, use it as is
                  else if (typeof item.customizations === 'object' && item.customizations !== null) {
                    customizations = { ...item.customizations };
                  }
                } catch (error) {
                  console.warn('Failed to parse customizations:', error);
                  customizations = {};
                }
              }

              return {
                ...item,
                product: item.product || null,
                customizations,
                // Ensure all required fields have default values
                order_id: item.order_id || null,
                product_id: item.product_id || null,
                created_at: item.created_at || null,
                quantity: item.quantity || 0,
                unit_price: item.unit_price || 0
              };
            })
          };

          return dbOrder;
        })
      );

      setOrders(ordersWithItems);
    } catch (error) {
      console.error('Error fetching orders:', error);
      addToast('Error al cargar los pedidos', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: DatabaseOrder['status']) => {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('No se pudo autenticar al usuario');
      }

      // Verify user has required role
      const userRole = user.user_metadata?.role || user.app_metadata?.role;
      if (!['kiosquero', 'admin'].includes(userRole)) {
        throw new Error('No tiene permisos para actualizar pedidos');
      }

      // Show loading state
      addToast(`Actualizando pedido ${orderId}...`, 'info');

      // Call the stored procedure
      const { error } = await supabase.rpc('update_order_status', {
        p_order_id: orderId,
        p_new_status: newStatus,
        p_user_id: user.id
      });

      if (error) {
        console.error('Database error:', error);
        throw new Error(
          error.message.includes('permission denied') 
            ? 'No tiene permisos para realizar esta acción' 
            : `Error al actualizar el pedido: ${error.message}`
        );
      }

      // Optimistic UI update
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId 
            ? { 
                ...order, 
                status: newStatus,
                completed_at: newStatus === 'entregado' ? new Date().toISOString() : order.completed_at,
                updated_at: new Date().toISOString()
              } 
            : order
        )
      );

      // Show success message
      addToast(
        `Pedido ${orderId} actualizado a: ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`, 
        'success'
      );
      
    } catch (error) {
      console.error('Error updating order status:', error);
      
      // Show error message
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Ocurrió un error inesperado al actualizar el pedido';
      
      addToast(errorMessage, 'error');
      
      // Refresh orders to ensure UI is in sync with the database
      setTimeout(() => {
        fetchOrders();
      }, 1000);
    }
  };
  // Transform database orders to match the frontend Order type
  const transformedOrders: Order[] = orders.map(order => {
    try {
      // Ensure we have a valid user_cycle for the Order type
      const validUserCycle = (order.user_cycle === 'ciclo_basico' || order.user_cycle === 'ciclo_superior')
        ? order.user_cycle
        : undefined;

      // Transform order items, ensuring all required fields are present
      const orderItems = order.order_items
        .filter(item => item.product !== null) // Filter out items with null product
        .map(item => ({
          product: {
            id: item.product!.id,
            name: item.product!.name,
            price: item.unit_price || 0,
            description: item.product!.description || '',
            image: item.product!.image_url || '',
            category: item.product!.category || '',
            available: item.product!.is_available ?? true,
            customizable: item.product!.customizable ?? false,
            ingredients: item.product!.ingredients || []
          },
          quantity: item.quantity || 1,
          customizations: item.customizations || {}
        }));

      return {
        id: order.id,
        userId: order.user_id || '', // Provide a default empty string if user_id is null
        items: orderItems,
        totalAmount: order.total_amount || 0,
        scheduledTime: order.scheduled_time,
        paymentMethod: order.payment_method || 'efectivo',
        status: order.status || 'pendiente',
        createdAt: order.created_at || new Date().toISOString(), // Provide a default timestamp if null
        userCycle: validUserCycle
      };
    } catch (error) {
      console.error('Error transforming order:', order.id, error);
      // Return a minimal valid order object that won't cause runtime errors
      return {
        id: order.id || 'error',
        userId: order.user_id || '',
        items: [],
        totalAmount: 0,
        scheduledTime: order.scheduled_time || new Date().toISOString(),
        paymentMethod: order.payment_method || 'efectivo',
        status: 'pendiente',
        createdAt: order.created_at || new Date().toISOString(),
        userCycle: undefined
      } as Order;
    }
  }).filter((order): order is Order => order !== null); // Filter out any null orders from errors

  const filteredOrders = transformedOrders.filter(order => {
    if (selectedTime === 'all') return true;
    return order.scheduledTime === selectedTime;
  });

  const formatPrice = (price: number) => {
    return `$${price.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'en_preparacion':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'listo':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'entregado':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'cancelado':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getNextStatus = (currentStatus: Order['status']) => {
    switch (currentStatus) {
      case 'pendiente':
        return 'en_preparacion';
      case 'en_preparacion':
        return 'listo';
      case 'listo':
        return 'entregado';
      default:
        return currentStatus;
    }
  };

  const getActionText = (status: Order['status']) => {
    switch (status) {
      case 'pendiente':
        return 'Iniciar Preparación';
      case 'en_preparacion':
        return 'Marcar como Listo';
      case 'listo':
        return 'Marcar como Entregado';
      default:
        return '';
    }
  };

  if (isLoading) {
    return (
      <div className="ml-64 min-h-screen bg-cream-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        <span className="ml-2">Cargando órdenes...</span>
      </div>
    );
  }

  return (
    <div className="ml-64 min-h-screen bg-cream-50">
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Panel de Órdenes</h1>
          <p className="text-gray-600">
            {transformedOrders.length} {transformedOrders.length === 1 ? 'pedido' : 'pedidos'} en total
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700">Filtrar por recreo:</span>
            <div className="flex space-x-2">
              <button
                onClick={() => setSelectedTime('all')}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  selectedTime === 'all'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Todos
              </button>
              {breakTimes.map((time) => (
                <button
                  key={time}
                  onClick={() => setSelectedTime(time)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    selectedTime === time
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {time}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {filteredOrders.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No hay pedidos para mostrar</p>
            </div>
          ) : (
            filteredOrders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center mb-2">
                      <span className="text-xl font-bold text-primary-600 mr-3">
                        {order.id}
                      </span>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(order.status)}`}>
                        {order.status === 'pendiente' && <Clock className="h-4 w-4 mr-1" />}
                        {order.status === 'en_preparacion' && <Package className="h-4 w-4 mr-1" />}
                        {order.status === 'listo' && <CheckCircle className="h-4 w-4 mr-1" />}
                        {order.status === 'entregado' && <CheckCircle className="h-4 w-4 mr-1" />}
                        {order.status === 'cancelado' && <XCircle className="h-4 w-4 mr-1" />}
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1).replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Pedido: {formatDate(order.createdAt)}
                    </p>
                    <p className="text-sm text-gray-600">
                      Retiro: <span className="font-medium">{order.scheduledTime}</span>
                    </p>
                    <p className="text-sm text-gray-600">
                      Ciclo: <span className="capitalize">{order.userCycle?.replace('_', ' ')}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-primary-600">
                      {formatPrice(order.totalAmount)}
                    </p>
                    <p className="text-sm text-gray-600 capitalize">
                      {order.paymentMethod}
                    </p>
                  </div>
                </div>

                {/* Order Items */}
                <div className="border-t border-gray-100 pt-4 mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">Productos:</h4>
                  <div className="space-y-2">
                    {order.items.map((item, itemIndex) => {
                      const customizations = item.customizations || {};
                      const ingredients = (customizations && Array.isArray(customizations.ingredients)) 
                        ? customizations.ingredients as string[] 
                        : [];
                      const condiments = (customizations && Array.isArray(customizations.condiments))
                        ? customizations.condiments as string[]
                        : [];

                      return (
                        <div key={itemIndex} className="flex items-center justify-between py-2 border-b">
                          <div>
                            <p className="font-medium">{item.product.name}</p>
                            {ingredients.length > 0 && (
                              <p className="text-sm text-gray-500">
                                Ingredientes: {ingredients.join(', ')}
                              </p>
                            )}
                            {condiments.length > 0 && (
                              <p className="text-sm text-gray-500">
                                Condimentos: {condiments.join(', ')}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-medium">${(item.product.price * item.quantity).toFixed(2)}</p>
                            <p className="text-sm text-gray-500">{item.quantity} x ${item.product.price.toFixed(2)}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-3">
                  {order.status !== 'entregado' && order.status !== 'cancelado' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, getNextStatus(order.status))}
                      className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      {getActionText(order.status)}
                    </button>
                  )}
                  
                  {order.status !== 'entregado' && order.status !== 'cancelado' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'cancelado')}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};