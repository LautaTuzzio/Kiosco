import React from 'react';
import { useCart } from '../../contexts/CartContext';
import { X, Plus, Minus, ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CartSidebar: React.FC<CartSidebarProps> = ({ isOpen, onClose }) => {
  const { items, updateQuantity, removeFromCart, getTotalAmount } = useCart();
  const navigate = useNavigate();

  const formatPrice = (price: number) => {
    return `$${price.toLocaleString()}`;
  };

  const handleCheckout = () => {
    onClose();
    navigate('/checkout');
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full sm:max-w-md bg-white shadow-xl z-50 transform transition-transform">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">Mi Carrito</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 sm:p-4">
          {items.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <ShoppingBag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Tu carrito está vacío</p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {items.map((item, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-3 sm:p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-gray-900 text-sm sm:text-base pr-2">{item.product.name}</h3>
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="text-red-500 hover:text-red-700 text-xs sm:text-sm flex-shrink-0"
                    >
                      Eliminar
                    </button>
                  </div>

                  {item.customizations && (
                    <div className="text-sm text-gray-600 mb-2">
                      {item.customizations.ingredients && (
                        <p><strong>Ingredientes:</strong> {item.customizations.ingredients.join(', ')}</p>
                      )}
                      {item.customizations.condiments && (
                        <p><strong>Condimentos:</strong> {item.customizations.condiments.join(', ')}</p>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        className="p-1 sm:p-1.5 rounded-full border border-gray-300 hover:bg-gray-100"
                      >
                        <Minus className="h-3 w-3 sm:h-4 sm:w-4" />
                      </button>
                      <span className="font-medium text-sm sm:text-base min-w-[1.5rem] text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        className="p-1 sm:p-1.5 rounded-full border border-gray-300 hover:bg-gray-100"
                      >
                        <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                      </button>
                    </div>
                    <span className="font-bold text-primary-600 text-sm sm:text-base">
                      {formatPrice(item.product.price * item.quantity)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <span className="text-base sm:text-lg font-bold text-gray-900">Total:</span>
              <span className="text-lg sm:text-xl font-bold text-primary-600">
                {formatPrice(getTotalAmount())}
              </span>
            </div>
            <button
              onClick={handleCheckout}
              className="w-full bg-primary-600 text-white py-2 sm:py-3 px-4 rounded-lg font-medium hover:bg-primary-700 transition-colors text-sm sm:text-base"
            >
              Proceder al Pago
            </button>
          </div>
        )}
      </div>
    </>
  );
};