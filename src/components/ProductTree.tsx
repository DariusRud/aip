import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface Category {
  id: string;
  name: string;
  parent_id: string | null;
  description: string | null;
  created_at: string;
  children?: Category[];
}

interface ProductTreeProps {
  userRole: string;
}

function ProductTree({ userRole }: ProductTreeProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const [newCategory, setNewCategory] = useState({
    name: '',
    parent_id: '',
    description: '',
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('product_categories')
        .select('*')
        .order('name');

      if (error) throw error;

      const hierarchicalData = buildHierarchy(data || []);
      setCategories(hierarchicalData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const buildHierarchy = (flatData: Category[]): Category[] => {
    const map = new Map<string, Category>();
    const roots: Category[] = [];

    flatData.forEach(item => {
      map.set(item.id, { ...item, children: [] });
    });

    flatData.forEach(item => {
      const node = map.get(item.id)!;
      if (item.parent_id === null) {
        roots.push(node);
      } else {
        const parent = map.get(item.parent_id);
        if (parent) {
          parent.children!.push(node);
        }
      }
    });

    return roots;
  };

  const getAllCategories = (cats: Category[]): Category[] => {
    const result: Category[] = [];
    const traverse = (items: Category[]) => {
      items.forEach(item => {
        result.push(item);
        if (item.children && item.children.length > 0) {
          traverse(item.children);
        }
      });
    };
    traverse(cats);
    return result;
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userRole !== 'admin') {
      setError('Tik administratoriai gali pridėti kategorijas');
      return;
    }

    try {
      const { error } = await supabase
        .from('product_categories')
        .insert([{
          name: newCategory.name,
          parent_id: newCategory.parent_id || null,
          description: newCategory.description || null,
        }]);

      if (error) throw error;

      setShowAddModal(false);
      setNewCategory({ name: '', parent_id: '', description: '' });
      fetchCategories();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || userRole !== 'admin') return;

    try {
      const { error } = await supabase
        .from('product_categories')
        .update({
          name: editingCategory.name,
          parent_id: editingCategory.parent_id || null,
          description: editingCategory.description || null,
        })
        .eq('id', editingCategory.id);

      if (error) throw error;

      setEditingCategory(null);
      fetchCategories();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Ar tikrai norite ištrinti šią kategoriją? Bus ištrintos ir visos pokategorijos.')) return;

    try {
      const { error } = await supabase
        .from('product_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchCategories();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedCategories(newExpanded);
  };

  const renderCategory = (category: Category, level: number = 0) => {
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = expandedCategories.has(category.id);

    return (
      <div key={category.id}>
        <div
          className="flex items-center gap-3 py-3 px-4 hover:bg-slate-50 rounded-lg group"
          style={{ paddingLeft: `${level * 2 + 1}rem` }}
        >
          {hasChildren && (
            <button
              onClick={() => toggleExpanded(category.id)}
              className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-slate-600"
            >
              <i className={`fas fa-chevron-${isExpanded ? 'down' : 'right'} text-xs`}></i>
            </button>
          )}
          {!hasChildren && <div className="w-5"></div>}

          <i className="fas fa-folder text-blue-500"></i>

          <div className="flex-1">
            <div className="font-medium text-slate-800">{category.name}</div>
            {category.description && (
              <div className="text-sm text-slate-500">{category.description}</div>
            )}
          </div>

          {userRole === 'admin' && (
            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
              <button
                onClick={() => setEditingCategory(category)}
                className="text-blue-600 hover:text-blue-700 p-1"
                title="Redaguoti"
              >
                <i className="fas fa-edit"></i>
              </button>
              <button
                onClick={() => handleDeleteCategory(category.id)}
                className="text-red-500 hover:text-red-700 p-1"
                title="Ištrinti"
              >
                <i className="fas fa-trash"></i>
              </button>
            </div>
          )}
        </div>

        {hasChildren && isExpanded && (
          <div>
            {category.children!.map(child => renderCategory(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full"><div className="text-slate-500">Kraunama...</div></div>;
  }

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="bg-white border-b border-slate-200 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Prekių Medis</h1>
            <p className="text-sm text-slate-500 mt-1">Prekių kategorijų hierarchijos valdymas</p>
          </div>
          {userRole === 'admin' && (
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <i className="fas fa-plus mr-2"></i>
              Pridėti Kategoriją
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mx-8 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-8">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          {categories.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <i className="fas fa-folder-open text-4xl mb-4"></i>
              <p>Nėra sukurtų kategorijų</p>
            </div>
          ) : (
            <div className="space-y-1">
              {categories.map(category => renderCategory(category))}
            </div>
          )}
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 text-slate-800">Nauja Kategorija</h2>
            <form onSubmit={handleAddCategory}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Pavadinimas</label>
                  <input
                    type="text"
                    value={newCategory.name}
                    onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tėvinė kategorija</label>
                  <select
                    value={newCategory.parent_id}
                    onChange={(e) => setNewCategory({ ...newCategory, parent_id: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Pagrindinė kategorija</option>
                    {getAllCategories(categories).map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Aprašymas</label>
                  <textarea
                    value={newCategory.description}
                    onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                >
                  Atšaukti
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Pridėti
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 text-slate-800">Redaguoti Kategoriją</h2>
            <form onSubmit={handleUpdateCategory}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Pavadinimas</label>
                  <input
                    type="text"
                    value={editingCategory.name}
                    onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tėvinė kategorija</label>
                  <select
                    value={editingCategory.parent_id || ''}
                    onChange={(e) => setEditingCategory({ ...editingCategory, parent_id: e.target.value || null })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Pagrindinė kategorija</option>
                    {getAllCategories(categories)
                      .filter(cat => cat.id !== editingCategory.id)
                      .map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Aprašymas</label>
                  <textarea
                    value={editingCategory.description || ''}
                    onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                >
                  Atšaukti
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Išsaugoti
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductTree;
