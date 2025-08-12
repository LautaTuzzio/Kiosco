import React, { useState } from 'react';
import { Product } from '../../types';
import { CONDIMENTS } from '../../data/mockData';
import { X, Check } from 'lucide-react';

interface SaladCustomizerProps {
  product: Product;
  quantity: number;
  onConfirm: (customizations: any) => void;
  onCancel: () => void;
}

export const SaladCustomizer: React.FC<SaladCustomizerProps> = ({
  product,
  quantity,
  onConfirm,
  onCancel
}) => {
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>(
    product.ingredients || []
  );
  const [selectedCondiments, setSelectedCondiments] = useState<string[]>([]);

  const toggleIngredient = (ingredient: string) => {
    setSelectedIngredients(prev =>
      prev.includes(ingredient)
        ? prev.filter(i => i !== ingredient)
        : [...prev, ingredient]
    );
  };

  const toggleCondiment = (condiment: string) => {
    setSelectedCondiments(prev =>
      prev.includes(condiment)
        ? prev.filter(c => c !== condiment)
        : [...prev, condiment]
    );
  };

  const handleConfirm = () => {
    onConfirm({
      ingredients: selectedIngredients,
      condiments: selectedCondiments
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-md w-full max-h-90vh overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            Personalizar {product.name}
          </h2>
          <button
            onClick={onCancel}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 space-y-6">
          {/* Ingredients */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Ingredientes
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {product.ingredients?.map((ingredient) => (
                <button
                  key={ingredient}
                  onClick={() => toggleIngredient(ingredient)}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                    selectedIngredients.includes(ingredient)
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <span className="capitalize">{ingredient}</span>
                  {selectedIngredients.includes(ingredient) && (
                    <Check className="h-4 w-4" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Condiments */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Condimentos
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {CONDIMENTS.map((condiment) => (
                <button
                  key={condiment}
                  onClick={() => toggleCondiment(condiment)}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                    selectedCondiments.includes(condiment)
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <span className="capitalize">{condiment}</span>
                  {selectedCondiments.includes(condiment) && (
                    <Check className="h-4 w-4" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="border-t border-gray-200 pt-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Resumen del pedido:</h4>
              <p className="text-sm text-gray-600">
                <strong>Cantidad:</strong> {quantity}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Ingredientes:</strong> {selectedIngredients.join(', ') || 'Ninguno'}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Condimentos:</strong> {selectedCondiments.join(', ') || 'Ninguno'}
              </p>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 flex space-x-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 py-3 px-4 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
          >
            Agregar al Carrito
          </button>
        </div>
      </div>
    </div>
  );
};