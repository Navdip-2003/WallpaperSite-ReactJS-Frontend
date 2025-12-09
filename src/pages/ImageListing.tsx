import { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import axiosInstance from '../lib/axios';
import { Loader2, AlertCircle, Image as ImageIcon, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

// ---------------------------
// Interfaces
// ---------------------------
interface Image {
  _id: string;
  title: string;
  category: {
    _id: string;
    name: string;
  };
  imageUrl: string;
  publicId: string;
  createdAt?: string;
}

interface Category {
  _id: string;
  name: string;
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  nextPage: number | null;
  prevPage: number | null;
}

export default function ImageListing() {
  const [images, setImages] = useState<Image[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [imageToDelete, setImageToDelete] = useState<Image | null>(null);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const limit = 10;

  // ---------------------------
  // Fetch Categories on Page Load
  // ---------------------------
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await axiosInstance.get('/categories');
      console.log('Categories Response:', res.data);
      
      if (res.data?.data) {
        setCategories(res.data.data);
      } else if (Array.isArray(res.data)) {
        setCategories(res.data);
      }
    } catch (err: any) {
      console.error('Categories error:', err);
      // Don't set error for categories - it's not critical
    }
  };

  // ---------------------------
  // Fetch Images when category or page changes
  // ---------------------------
  useEffect(() => {
    fetchImages();
  }, [selectedCategory, currentPage]);

  const fetchImages = async () => {
    setLoading(true);
    setError('');

    try {
      // Build query parameters
      const params: Record<string, string> = {
        page: currentPage.toString(),
        limit: limit.toString(),
      };

      if (selectedCategory !== 'All') {
        params.category = selectedCategory;
      }

      const queryString = new URLSearchParams(params).toString();
      const url = `/images?${queryString}`;
      
      console.log('Fetching:', url);
      
      const response = await axiosInstance.get(url);
      
      console.log('Full Response:', response);
      console.log('Response Data:', response.data);
      
      // Check if response has the expected structure
      if (response.data && response.data.success) {
        // Set images
        if (Array.isArray(response.data.data)) {
          setImages(response.data.data);
          console.log('Images set:', response.data.data.length);
        } else {
          console.error('Data is not an array:', response.data.data);
          setImages([]);
        }
        
        // Set pagination
        if (response.data.pagination) {
          setPagination(response.data.pagination);
          console.log('Pagination set:', response.data.pagination);
        }
      } else {
        console.error('Unexpected response structure:', response.data);
        setError('Unexpected response from server');
      }
    } catch (err: any) {
      console.error('Fetch Images Error:', err);
      console.error('Error Response:', err.response);
      
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch images';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------
  // Handle Category Change
  // ---------------------------
  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setCurrentPage(1);
  };

  // ---------------------------
  // Pagination Handlers
  // ---------------------------
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && pagination && newPage <= pagination.totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goToNextPage = () => pagination?.nextPage && handlePageChange(pagination.nextPage);
  const goToPrevPage = () => pagination?.prevPage && handlePageChange(pagination.prevPage);

  // ---------------------------
  // Delete Image Handler
  // ---------------------------
  const handleDeleteClick = (image: Image) => {
    setImageToDelete(image);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!imageToDelete) return;

    setDeletingId(imageToDelete._id);
    try {
      await axiosInstance.delete(`/images/${imageToDelete._id}`);
      
      // Refresh the current page after deletion
      await fetchImages();
      
      setShowDeleteModal(false);
      setImageToDelete(null);
    } catch (err: any) {
      console.error('Delete error:', err);
      setError(err.response?.data?.message || 'Failed to delete image');
      setShowDeleteModal(false);
      setImageToDelete(null);
    } finally {
      setDeletingId(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setImageToDelete(null);
  };

  // ---------------------------
  // Generate Page Numbers
  // ---------------------------
  const getPageNumbers = () => {
    if (!pagination) return [];
    
    const pages: (number | string)[] = [];
    const { currentPage, totalPages } = pagination;
    
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      
      if (currentPage > 3) {
        pages.push('...');
      }
      
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (currentPage < totalPages - 2) {
        pages.push('...');
      }
      
      pages.push(totalPages);
    }
    
    return pages;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Image Gallery</h1>
          <p className="text-gray-600 mt-2">
            Browse and filter your image collection
          </p>
        </div>

        {/* CATEGORY FILTERS */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => handleCategoryChange('All')}
              className={`px-6 py-2.5 rounded-lg font-medium transition-all ${
                selectedCategory === 'All'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-gray-700 hover:bg-gray-100 shadow-sm'
              }`}
            >
              All
            </button>

            {categories.map((cat) => (
              <button
                key={cat._id}
                onClick={() => handleCategoryChange(cat._id)}
                className={`px-6 py-2.5 rounded-lg font-medium transition-all ${
                  selectedCategory === cat._id
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-white text-gray-700 hover:bg-gray-100 shadow-sm'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* IMAGES LISTING CONTAINER */}
        <div className="bg-white rounded-lg shadow-md p-6">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <p className="text-red-600 text-lg">{error}</p>
                <button
                  onClick={() => {
                    setError('');
                    fetchImages();
                  }}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : images.length === 0 ? (
            <div className="text-center py-20">
              <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">
                {selectedCategory === 'All'
                  ? 'No images found'
                  : 'No images found in this category'}
              </p>
            </div>
          ) : (
            <>
              {/* PAGINATION INFO */}
              {pagination && (
                <div className="mb-4 flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Showing {((currentPage - 1) * limit) + 1} to {Math.min(currentPage * limit, pagination.totalRecords)} of {pagination.totalRecords} images
                  </div>
                  <div className="text-sm text-gray-600">
                    Page {currentPage} of {pagination.totalPages}
                  </div>
                </div>
              )}

              {/* IMAGES GRID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-6">
                {images.map((image) => (
                  <div
                    key={image._id}
                    className="group relative overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-shadow bg-white"
                  >
                    <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden relative">
                      <img
                        src={image.imageUrl}
                        alt={image.title}
                        className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      
                      <button
                        onClick={() => handleDeleteClick(image)}
                        disabled={deletingId === image._id}
                        className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700 disabled:bg-gray-400"
                        title="Delete image"
                      >
                        {deletingId === image._id ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Trash2 className="w-5 h-5" />
                        )}
                      </button>
                    </div>

                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 truncate mb-2">
                        {image.title}
                      </h3>

                      <div className="flex items-center justify-between">
                        <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                          {image.category?.name}
                        </span>

                        {image.createdAt && (
                          <span className="text-xs text-gray-500">
                            {new Date(image.createdAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* PAGINATION CONTROLS */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <button
                    onClick={goToPrevPage}
                    disabled={!pagination.hasPrevPage}
                    className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Previous page"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  {getPageNumbers().map((page, index) => (
                    <button
                      key={index}
                      onClick={() => typeof page === 'number' && handlePageChange(page)}
                      disabled={page === '...' || page === currentPage}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        page === currentPage
                          ? 'bg-blue-600 text-white'
                          : page === '...'
                          ? 'cursor-default text-gray-400'
                          : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    onClick={goToNextPage}
                    disabled={!pagination.hasNextPage}
                    className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Next page"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteModal && imageToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Delete Image</h2>
            </div>

            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "<strong>{imageToDelete.title}</strong>"? 
              This action cannot be undone.
            </p>

            <div className="flex gap-3 justify-end">
              <button
                onClick={cancelDelete}
                disabled={deletingId !== null}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deletingId !== null}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
              >
                {deletingId ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}