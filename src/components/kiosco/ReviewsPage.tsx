import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, User, Calendar, Package, AlertTriangle } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Review } from '../../types';
import { ReportModal } from '../common/ReportModal';

export const ReviewsPage: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRating, setSelectedRating] = useState<number | 'all'>('all');
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{id: string, name: string, role: string} | null>(null);
  const { addToast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    try {
      const { data: supabaseReviews, error } = await supabase
        .from('reviews')
        .select(`
          *,
          users!inner(name),
          orders!inner(total_amount)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading reviews:', error);
        addToast('Error al cargar reseñas', 'error');
        return;
      }

      if (supabaseReviews) {
        const formattedReviews = supabaseReviews.map(review => ({
          id: review.id,
          order_id: review.order_id,
          user_id: review.user_id,
          rating: review.rating,
          comment: review.comment,
          created_at: review.created_at,
          updated_at: review.updated_at,
          user_name: Array.isArray(review.users) ? review.users[0]?.name : review.users?.name || 'Usuario',
          order_total: Array.isArray(review.orders) ? review.orders[0]?.total_amount : review.orders?.total_amount || 0
        }));
        setReviews(formattedReviews);
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
      addToast('Error al cargar reseñas', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleReportUser = (userId: string, userName: string) => {
    setSelectedUser({ id: userId, name: userName, role: 'ciclo_basico' }); // Default role, could be enhanced
    setShowReportModal(true);
  };

  const filteredReviews = reviews.filter(review => {
    if (selectedRating === 'all') return true;
    return review.rating === selectedRating;
  });

  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : 0;

  const ratingDistribution = [5, 4, 3, 2, 1].map(rating => ({
    rating,
    count: reviews.filter(r => r.rating === rating).length,
    percentage: reviews.length > 0 ? (reviews.filter(r => r.rating === rating).length / reviews.length) * 100 : 0
  }));

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price: number) => {
    return `$${price.toLocaleString()}`;
  };

  const renderStars = (rating: number, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeClasses = {
      sm: 'h-4 w-4',
      md: 'h-5 w-5',
      lg: 'h-6 w-6'
    };

    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClasses[size]} ${
              star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="ml-64 min-h-screen bg-cream-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando reseñas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ml-64 min-h-screen bg-cream-50">
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Reseñas de Clientes</h1>
          <p className="text-gray-600">Feedback y calificaciones de los pedidos</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Star className="h-8 w-8 text-yellow-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Calificación Promedio</p>
                <p className="text-2xl font-bold text-gray-900">
                  {averageRating.toFixed(1)}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <MessageSquare className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Reseñas</p>
                <p className="text-2xl font-bold text-gray-900">{reviews.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Star className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">5 Estrellas</p>
                <p className="text-2xl font-bold text-gray-900">
                  {ratingDistribution.find(r => r.rating === 5)?.count || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Con Comentarios</p>
                <p className="text-2xl font-bold text-gray-900">
                  {reviews.filter(r => r.comment && r.comment.trim()).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Rating Distribution */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribución de Calificaciones</h3>
            <div className="space-y-3">
              {ratingDistribution.map(({ rating, count, percentage }) => (
                <div key={rating} className="flex items-center">
                  <span className="text-sm font-medium text-gray-700 w-8">{rating}</span>
                  <Star className="h-4 w-4 text-yellow-400 fill-current mr-2" />
                  <div className="flex-1 bg-gray-200 rounded-full h-2 mr-3">
                    <div
                      className="bg-yellow-400 h-2 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 w-8">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Reviews List */}
          <div className="lg:col-span-3 space-y-4">
            {/* Filter */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-gray-700">Filtrar por calificación:</span>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setSelectedRating('all')}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      selectedRating === 'all'
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Todas
                  </button>
                  {[5, 4, 3, 2, 1].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => setSelectedRating(rating)}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors flex items-center ${
                        selectedRating === rating
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {rating} <Star className="h-3 w-3 ml-1" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Reviews */}
            {filteredReviews.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  {selectedRating === 'all' ? 'No hay reseñas aún' : `No hay reseñas con ${selectedRating} estrella${selectedRating !== 1 ? 's' : ''}`}
                </p>
              </div>
            ) : (
              filteredReviews.map((review) => (
                <div key={review.id} className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center mr-3">
                        <User className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{review.user_name}</h4>
                        <div className="flex items-center mt-1">
                          {renderStars(review.rating, 'sm')}
                          <span className="ml-2 text-sm text-gray-600">
                            {review.rating}/5
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <button
                        onClick={() => handleReportUser(review.user_id, review.user_name || 'Usuario')}
                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors"
                        title="Reportar usuario"
                      >
                        <AlertTriangle className="h-4 w-4" />
                      </button>
                      <div className="text-right">
                      <p className="text-sm text-gray-600">Pedido #{review.order_id}</p>
                      <p className="text-sm font-medium text-primary-600">
                        {formatPrice(review.order_total || 0)}
                      </p>
                      </div>
                    </div>
                  </div>

                  {review.comment && (
                    <div className="mb-4">
                      <p className="text-gray-700 bg-gray-50 rounded-lg p-3">
                        "{review.comment}"
                      </p>
                    </div>
                  )}

                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>{formatDate(review.created_at)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Report Modal */}
      {showReportModal && selectedUser && (
        <ReportModal
          isOpen={showReportModal}
          onClose={() => {
            setShowReportModal(false);
            setSelectedUser(null);
          }}
          reportedUserId={selectedUser.id}
          reportedUserName={selectedUser.name}
          reportedUserRole={selectedUser.role}
        />
      )}
    </div>
  );
};