import React, { useState, useEffect } from 'react';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Edit, Save, X, Plus, Package, Trash2 } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string | null;
  image_url: string | null;
  is_available: boolean;
  is_customizable: boolean;
  ingredients: string[] | null;
  stock_quantity: number;
  min_stock_alert: number;
}

export const InventoryPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Product>>({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [addingProduct, setAddingProduct] = useState(false);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '',
    category: 'ensaladas',
    price: 0,
    description: '',
    image_url: 'https://images.pexels.com/photos/1213710/pexels-photo-1213710.jpeg?auto=compress&cs=tinysrgb&w=400',
    is_available: true,
    is_customizable: false,
    ingredients: [],
    stock_quantity: 0,
    min_stock_alert: 5
  });
  const { addToast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      // For kiosquero and admin, load all products regardless of RLS
      if (user?.role === 'kiosquero' || user?.role === 'admin') {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('name');

        if (error) {
          console.error('Supabase error:', error);
          // Fallback to localStorage for demo
          const localProducts = JSON.parse(localStorage.getItem('products') || '[]');
          setProducts(localProducts);
        } else {
          setProducts(data || []);
        }
      } else {
        // For students, only available products
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('is_available', true)
          .order('name');

        if (error) {
          console.error('Supabase error:', error);
          const localProducts = JSON.parse(localStorage.getItem('products') || '[]');
          setProducts(localProducts.filter((p: Product) => p.is_available));
        } else {
          setProducts(data || []);
        }
      }
    } catch (error) {
      console.error('Error loading products:', error);
      addToast('Error al cargar productos', 'error');
      // Fallback to localStorage
      const localProducts = JSON.parse(localStorage.getItem('products') || '[]');
      setProducts(localProducts);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingId(product.id);
    setEditForm(product);
  };

  const handleSave = async () => {
    if (!editingId || !editForm) return;

    try {
      // Try Supabase first
      const { error } = await supabase
        .from('products')
        .update({
          name: editForm.name,
          category: editForm.category,
          price: editForm.price,
          description: editForm.description,
          image_url: editForm.image_url,
          is_available: editForm.is_available,
          is_customizable: editForm.is_customizable,
          ingredients: editForm.ingredients,
          stock_quantity: editForm.stock_quantity,
          min_stock_alert: editForm.min_stock_alert,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingId);

      if (error) {
        console.error('Supabase update error:', error);
        // Fallback to localStorage
        const localProducts = JSON.parse(localStorage.getItem('products') || '[]');
        const updatedProducts = localProducts.map((p: Product) => 
          p.id === editingId ? { ...p, ...editForm } : p
        );
        localStorage.setItem('products', JSON.stringify(updatedProducts));
        setProducts(updatedProducts);
      } else {
        await loadProducts();
      }

      setEditingId(null);
      setEditForm({});
      addToast('Producto actualizado correctamente', 'success');
    } catch (error) {
      console.error('Error updating product:', error);
      addToast('Error al actualizar producto', 'error');
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.price) {
      addToast('Por favor completa todos los campos requeridos', 'error');
      return;
    }

    setAddingProduct(true);

    try {
      const productData = {
        name: newProduct.name,
        category: newProduct.category,
        price: newProduct.price,
        description: newProduct.description,
        image_url: newProduct.image_url,
        is_available: newProduct.is_available,
        is_customizable: newProduct.is_customizable,
        ingredients: newProduct.ingredients,
        stock_quantity: newProduct.stock_quantity,
        min_stock_alert: newProduct.min_stock_alert
      };

      // Try Supabase first
      const { data, error } = await supabase
        .from('products')
        .insert([productData])
        .select();

      if (error) {
        console.error('Supabase insert error:', error);
        // Fallback to localStorage for demo
        const newId = 'local-' + Date.now();
        const productWithId = { ...productData, id: newId };
        
        const localProducts = JSON.parse(localStorage.getItem('products') || '[]');
        const updatedProducts = [...localProducts, productWithId];
        localStorage.setItem('products', JSON.stringify(updatedProducts));
        setProducts(updatedProducts);
        
        addToast('Producto agregado localmente (demo)', 'success');
      } else {
        // Reload products to get the latest data
        await loadProducts();
        addToast('Producto agregado correctamente', 'success');
      }
      
      // Reset form
      setNewProduct({
        name: '',
        category: 'ensaladas',
        price: 0,
        description: '',
        image_url: 'https://images.pexels.com/photos/1213710/pexels-photo-1213710.jpeg?auto=compress&cs=tinysrgb&w=400',
        is_available: true,
        is_customizable: false,
        ingredients: [],
        stock_quantity: 0,
        min_stock_alert: 5
      });
      
      setShowAddModal(false);
    } catch (error) {
      console.error('Error adding product:', error);
      addToast('Error al agregar producto', 'error');
    } finally {
      setAddingProduct(false);
    }
  };

  const handleCancelAdd = () => {
    setNewProduct({
      name: '',
      category: 'ensaladas',
      price: 0,
      description: '',
      image_url: 'https://images.pexels.com/photos/1213710/pexels-photo-1213710.jpeg?auto=compress&cs=tinysrgb&w=400',
      is_available: true,
      is_customizable: false,
      ingredients: [],
      stock_quantity: 0,
      min_stock_alert: 5
    });
    setShowAddModal(false);
  };

  const toggleAvailability = async (productId: string, currentAvailability: boolean) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({
          is_available: !currentAvailability,
          updated_at: new Date().toISOString()
        })
        .eq('id', productId);

      if (error) {
        console.error('Supabase toggle error:', error);
        // Fallback to localStorage
        const localProducts = JSON.parse(localStorage.getItem('products') || '[]');
        const updatedProducts = localProducts.map((p: Product) =>
          p.id === productId ? { ...p, is_available: !currentAvailability } : p
        );
        localStorage.setItem('products', JSON.stringify(updatedProducts));
        setProducts(updatedProducts);
      } else {
        await loadProducts();
      }

      addToast('Disponibilidad actualizada', 'success');
    } catch (error) {
      console.error('Error updating availability:', error);
      addToast('Error al actualizar disponibilidad', 'error');
    }
  };

  const handleDeleteProduct = async (productId: string, productName: string) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar el producto "${productName}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) {
        console.error('Supabase delete error:', error);
        // Fallback to localStorage
        const localProducts = JSON.parse(localStorage.getItem('products') || '[]');
        const updatedProducts = localProducts.filter((p: Product) => p.id !== productId);
        localStorage.setItem('products', JSON.stringify(updatedProducts));
        setProducts(updatedProducts);
      } else {
        await loadProducts();
      }

      addToast('Producto eliminado correctamente', 'success');
    } catch (error) {
      console.error('Error deleting product:', error);
      addToast('Error al eliminar producto', 'error');
    }
  };

  const formatPrice = (price: number) => {
    return `$${price.toLocaleString()}`;
  };

  if (loading) {
    return (
      <div className="pt-16 lg:pt-0 lg:ml-64 min-h-screen bg-cream-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando productos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-16 lg:pt-0 lg:ml-64 min-h-screen bg-cream-50">
      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Gestión de Inventario</h1>
            <p className="text-gray-600">Administra productos, precios y disponibilidad</p>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Agregar Producto
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Producto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoría
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Precio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <img
                          className="h-12 w-12 rounded-lg object-cover mr-4"
                          src={product.image_url || 'https://images.pexels.com/photos/1213710/pexels-photo-1213710.jpeg?auto=compress&cs=tinysrgb&w=400'}
                          alt={product.name}
                        />
                        <div>
                          {editingId === product.id ? (
                            <input
                              type="text"
                              value={editForm.name || ''}
                              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                              className="font-medium text-gray-900 border border-gray-300 rounded px-2 py-1"
                            />
                          ) : (
                            <div className="font-medium text-gray-900">{product.name}</div>
                          )}
                          <div className="text-sm text-gray-500">
                            {editingId === product.id ? (
                              <input
                                type="text"
                                value={editForm.description || ''}
                                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                className="text-gray-500 border border-gray-300 rounded px-2 py-1 w-full"
                              />
                            ) : (
                              product.description
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="capitalize text-gray-900">{product.category}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingId === product.id ? (
                        <input
                          type="number"
                          value={editForm.price || ''}
                          onChange={(e) => setEditForm({ ...editForm, price: Number(e.target.value) })}
                          className="text-gray-900 border border-gray-300 rounded px-2 py-1 w-20"
                        />
                      ) : (
                        <span className="text-gray-900 font-medium">{formatPrice(product.price)}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingId === product.id ? (
                        <input
                          type="number"
                          value={editForm.stock_quantity || ''}
                          onChange={(e) => setEditForm({ ...editForm, stock_quantity: Number(e.target.value) })}
                          className="text-gray-900 border border-gray-300 rounded px-2 py-1 w-16"
                        />
                      ) : (
                        <span className={`text-gray-900 ${product.stock_quantity <= product.min_stock_alert ? 'text-red-600 font-bold' : ''}`}>
                          {product.stock_quantity}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        product.is_available
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {product.is_available ? 'Disponible' : 'No disponible'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {editingId === product.id ? (
                        <div className="flex space-x-2">
                          <button
                            onClick={handleSave}
                            className="text-green-600 hover:text-green-900"
                            title="Guardar cambios"
                          >
                            <Save className="h-4 w-4" />
                          </button>
                          <button
                            onClick={handleCancel}
                            className="text-gray-600 hover:text-gray-900"
                            title="Cancelar"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(product)}
                            className="text-primary-600 hover:text-primary-900"
                            title="Editar producto"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => toggleAvailability(product.id, product.is_available)}
                            className={`${
                              product.is_available ? 'text-orange-600 hover:text-orange-900' : 'text-green-600 hover:text-green-900'
                            }`}
                            title={product.is_available ? 'Marcar como no disponible' : 'Marcar como disponible'}
                          >
                            <Package className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product.id, product.name)}
                            className="text-red-600 hover:text-red-900"
                            title="Eliminar producto"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={handleCancelAdd} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between rounded-t-xl">
                <h2 className="text-xl font-bold text-gray-900">Agregar Nuevo Producto</h2>
                <button
                  onClick={handleCancelAdd}
                  className="p-2 rounded-full hover:bg-gray-100"
                  disabled={addingProduct}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre *
                    </label>
                    <input
                      type="text"
                      value={newProduct.name || ''}
                      onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Nombre del producto"
                      disabled={addingProduct}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Categoría *
                    </label>
                    <select
                      value={newProduct.category || 'ensaladas'}
                      onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      disabled={addingProduct}
                    >
                      <option value="ensaladas">Ensaladas</option>
                      <option value="tostados">Tostados</option>
                      <option value="sandwiches">Sándwiches</option>
                      <option value="bebidas">Bebidas</option>
                      <option value="empanadas">Empanadas</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Precio *
                    </label>
                    <input
                      type="number"
                      value={newProduct.price || ''}
                      onChange={(e) => setNewProduct({ ...newProduct, price: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Precio en pesos"
                      disabled={addingProduct}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Stock Inicial
                    </label>
                    <input
                      type="number"
                      value={newProduct.stock_quantity || ''}
                      onChange={(e) => setNewProduct({ ...newProduct, stock_quantity: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Cantidad en stock"
                      disabled={addingProduct}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Alerta de Stock Mínimo
                    </label>
                    <input
                      type="number"
                      value={newProduct.min_stock_alert || ''}
                      onChange={(e) => setNewProduct({ ...newProduct, min_stock_alert: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Cantidad mínima"
                      disabled={addingProduct}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      URL de Imagen
                    </label>
                    <input
                      type="url"
                      value={newProduct.image_url || ''}
                      onChange={(e) => setNewProduct({ ...newProduct, image_url: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="https://..."
                      disabled={addingProduct}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descripción
                    </label>
                    <textarea
                      value={newProduct.description || ''}
                      onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      rows={3}
                      placeholder="Descripción del producto"
                      disabled={addingProduct}
                    />
                  </div>

                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newProduct.is_available ?? true}
                        onChange={(e) => setNewProduct({ ...newProduct, is_available: e.target.checked })}
                        className="mr-2"
                        disabled={addingProduct}
                      />
                      <span className="text-sm text-gray-700">Disponible</span>
                    </label>
                    
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newProduct.is_customizable ?? false}
                        onChange={(e) => setNewProduct({ ...newProduct, is_customizable: e.target.checked })}
                        className="mr-2"
                        disabled={addingProduct}
                      />
                      <span className="text-sm text-gray-700">Personalizable</span>
                    </label>
                  </div>
                </div>

                <div className="flex space-x-3 mt-6">
                  <button
                    onClick={handleAddProduct}
                    disabled={addingProduct || !newProduct.name || !newProduct.price}
                    className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {addingProduct ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Agregando...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Guardar Producto
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleCancelAdd}
                    disabled={addingProduct}
                    className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center disabled:opacity-50"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};