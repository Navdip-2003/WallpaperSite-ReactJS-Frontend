import { useState, useEffect } from 'react';
import { Loader2, Plus, Edit2, Trash2, X, FolderPlus, AlertCircle, ImageIcon } from 'lucide-react';

// Mock axios instance for demonstration - replace with your actual import
import axiosInstance from '../lib/axios';
import Navigation from '../components/Navigation';

// Interfaces
interface Category {
  _id: string;
  name: string;
}

interface DeleteCategoryInfo {
  category: Category;
  imageCount: number;
  loading: boolean;
}

export default function CategoryManagement() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  
  // Delete Modal States
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteCategoryInfo, setDeleteCategoryInfo] = useState<DeleteCategoryInfo | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [securityCode, setSecurityCode] = useState('');
  const [securityCodeError, setSecurityCodeError] = useState('');

  // Fetch Categories on Mount
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    setError('');
    
    try {
      const res = await axiosInstance.get('/categories');
      
      if (res.data?.data) {
        setCategories(res.data.data);
      } else if (Array.isArray(res.data)) {
        setCategories(res.data);
      }
    } catch (err: any) {
      console.error('Fetch categories error:', err);
      setError(err.response?.data?.message || 'Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  // Fetch Image Count for Category
  const fetchCategoryImageCount = async (categoryId: string): Promise<number> => {
    try {
      const res = await axiosInstance.get(`/images?category=${categoryId}&limit=1`);
      
      // Check different possible response structures
      if (res.data?.pagination?.totalRecords !== undefined) {
        return res.data.pagination.totalRecords;
      } else if (res.data?.totalRecords !== undefined) {
        return res.data.totalRecords;
      } else if (res.data?.data && Array.isArray(res.data.data)) {
        // Fallback: if pagination info not available, fetch all to count
        const allRes = await axiosInstance.get(`/images?category=${categoryId}`);
        return allRes.data?.data?.length || 0;
      }
      
      return 0;
    } catch (err) {
      console.error('Error fetching image count:', err);
      return 0;
    }
  };

  // Open Create Modal
  const openCreateModal = () => {
    setModalMode('create');
    setCategoryName('');
    setEditingCategory(null);
    setModalError('');
    setShowModal(true);
  };

  // Open Edit Modal
  const openEditModal = (category: Category) => {
    setModalMode('edit');
    setCategoryName(category.name);
    setEditingCategory(category);
    setModalError('');
    setShowModal(true);
  };

  // Close Modal
  const closeModal = () => {
    setShowModal(false);
    setCategoryName('');
    setEditingCategory(null);
    setModalError('');
  };

  // Handle Save (Create/Edit)
  const handleSave = async () => {
    if (!categoryName.trim()) {
      setModalError('Category name is required');
      return;
    }

    setModalLoading(true);
    setModalError('');

    try {
      if (modalMode === 'create') {
        await axiosInstance.post('/categories', { name: categoryName.trim() });
      } else if (editingCategory) {
        await axiosInstance.put(`/categories/${editingCategory._id}`, { 
          name: categoryName.trim() 
        });
      }

      await fetchCategories();
      closeModal();
    } catch (err: any) {
      console.error('Save category error:', err);
      setModalError(err.response?.data?.message || 'Failed to save category');
    } finally {
      setModalLoading(false);
    }
  };

  // Open Delete Modal
  const openDeleteModal = async (category: Category) => {
    // Initialize with loading state
    setDeleteCategoryInfo({
      category,
      imageCount: 0,
      loading: true,
    });
    setShowDeleteModal(true);

    // Fetch image count in background
    const imageCount = await fetchCategoryImageCount(category._id);
    
    setDeleteCategoryInfo({
      category,
      imageCount,
      loading: false,
    });
  };

  // Close Delete Modal
  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setDeleteCategoryInfo(null);
    setSecurityCode('');
    setSecurityCodeError('');
  };

  // Generate current time-based code (HHMM format)
  const getCurrentSecurityCode = (): string => {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    return `${hours}${minutes}`;
  };

  // Confirm Delete
  const confirmDelete = async () => {
    if (!deleteCategoryInfo) return;

    // If category has images, verify security code
    if (deleteCategoryInfo.imageCount > 0) {
      const correctCode = getCurrentSecurityCode();
      console.log(correctCode);
      
      if (securityCode.trim() !== correctCode) {
        setSecurityCodeError(`Invalid code. Contact Patel Saheb for the current code`);
        return;
      }
    }

    setDeleteLoading(true);
    setSecurityCodeError('');
    
    try {
      await axiosInstance.delete(`/categories/${deleteCategoryInfo.category._id}`);
      await fetchCategories();
      closeDeleteModal();
    } catch (err: any) {
      console.error('Delete category error:', err);
      setError(err.response?.data?.message || 'Failed to delete category');
      closeDeleteModal();
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Category Management</h1>
              <p className="text-gray-600 mt-1">Manage your image categories</p>
            </div>
            <button
              onClick={openCreateModal}
              className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium"
            >
              <Plus className="w-5 h-5" />
              Add Category
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <p className="text-red-600 text-lg mb-4">{error}</p>
                <button
                  onClick={() => {
                    setError('');
                    fetchCategories();
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-20">
              <FolderPlus className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg mb-2">No categories yet</p>
              <p className="text-gray-400 text-sm mb-6">Create your first category to get started</p>
              <button
                onClick={openCreateModal}
                className="inline-flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <Plus className="w-5 h-5" />
                Add Category
              </button>
            </div>
          ) : (
            <div className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  All Categories ({categories.length})
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {categories.map((category) => (
                  <div
                    key={category._id}
                    className="group relative flex items-center justify-between p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <FolderPlus className="w-5 h-5 text-blue-600" />
                      </div>
                      <span className="font-medium text-gray-900 truncate">
                        {category.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 ml-2">
                      <button
                        onClick={() => openEditModal(category)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit category"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openDeleteModal(category)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete category"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {modalMode === 'create' ? 'Create New Category' : 'Edit Category'}
              </h2>
              <button
                onClick={closeModal}
                disabled={modalLoading}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {modalError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-600">{modalError}</p>
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSave()}
                placeholder="e.g., Nature, Architecture, People"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                disabled={modalLoading}
                autoFocus
              />
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={closeModal}
                disabled={modalLoading}
                className="px-5 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={modalLoading || !categoryName.trim()}
                className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 font-medium"
              >
                {modalLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  modalMode === 'create' ? 'Create' : 'Update'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal with Image Count */}
      {showDeleteModal && deleteCategoryInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-start mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900 mb-2">Delete Category</h2>
                <p className="text-gray-600 mb-3">
                  Are you sure you want to delete the category{' '}
                  <strong className="text-gray-900">"{deleteCategoryInfo.category.name}"</strong>?
                </p>

                {/* Image Count Info */}
                {deleteCategoryInfo.loading ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-3">
                    <Loader2 className="w-5 h-5 text-blue-600 animate-spin flex-shrink-0" />
                    <p className="text-sm text-blue-800">
                      Checking for associated images...
                    </p>
                  </div>
                ) : (
                  <div className={`border rounded-lg p-4 ${
                    deleteCategoryInfo.imageCount > 0 
                      ? 'bg-amber-50 border-amber-200' 
                      : 'bg-green-50 border-green-200'
                  }`}>
                    <div className="flex items-start gap-3">
                      <ImageIcon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                        deleteCategoryInfo.imageCount > 0 
                          ? 'text-amber-600' 
                          : 'text-green-600'
                      }`} />
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${
                          deleteCategoryInfo.imageCount > 0 
                            ? 'text-amber-900' 
                            : 'text-green-900'
                        }`}>
                          {deleteCategoryInfo.imageCount > 0 ? (
                            <>
                              {deleteCategoryInfo.imageCount} image{deleteCategoryInfo.imageCount !== 1 ? 's' : ''} found
                            </>
                          ) : (
                            'No images in this category'
                          )}
                        </p>
                        {deleteCategoryInfo.imageCount > 0 && (
                          <p className="text-xs text-amber-700 mt-1">
                            Deleting this category will affect {deleteCategoryInfo.imageCount} image{deleteCategoryInfo.imageCount !== 1 ? 's' : ''}. 
                            These images may become uncategorized or inaccessible.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Warning Message */}
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600 font-medium">
                    ⚠️ This action cannot be undone
                  </p>
                </div>

                {/* Security Code Input - Only show if images exist */}
                {!deleteCategoryInfo.loading && deleteCategoryInfo.imageCount > 0 && (
                  <div className="mt-4 p-4 bg-orange-50 border-2 border-orange-300 rounded-lg">
                    <div className="flex items-start gap-2 mb-3">
                      <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-orange-900 mb-1">
                          Security Verification Required
                        </p>
                        <p className="text-xs text-orange-700">
                          This category contains {deleteCategoryInfo.imageCount} image{deleteCategoryInfo.imageCount !== 1 ? 's' : ''}. 
                          Contact <strong>Patel Saheb</strong> to get the security code before proceeding.
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Enter Security Code <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={securityCode}
                        onChange={(e) => {
                          setSecurityCode(e.target.value);
                          setSecurityCodeError('');
                        }}
                        placeholder="Enter 4-digit code"
                        maxLength={4}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-shadow"
                        disabled={deleteLoading}
                      />
                      {securityCodeError && (
                        <p className="mt-2 text-sm text-red-600 flex items-start gap-1">
                          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                          {securityCodeError}
                        </p>
                      )}
                      
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={closeDeleteModal}
                disabled={deleteLoading}
                className="px-5 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={
                  deleteLoading || 
                  deleteCategoryInfo.loading || 
                  (deleteCategoryInfo.imageCount > 0 && !securityCode.trim())
                }
                className="px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center gap-2 font-medium"
              >
                {deleteLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete Category
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}