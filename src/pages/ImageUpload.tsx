import { useState, FormEvent, ChangeEvent, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import axiosInstance from '../lib/axios';
import { Upload, Image as ImageIcon, CheckCircle, AlertCircle, X, Loader2 } from 'lucide-react';

interface ImagePreview {
  file: File;
  preview: string;
  id: string;
  size: number; // in bytes
  sizeFormatted: string; // formatted size (e.g., "2.5 MB")
  isLarge: boolean; // true if > 1MB
}

interface UploadResult {
  fileName: string;
  success: boolean;
  error?: string;
}

interface UploadProgress {
  total: number;
  current: number;
  currentFileName: string;
  percentage: number;
}

export default function ImageUpload() {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [images, setImages] = useState<ImagePreview[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadResults, setUploadResults] = useState<UploadResult[]>([]);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await axiosInstance.get('/categories');
      setCategories(res.data.data);
    } catch (err) {
      console.error(err);
      setError("Failed to load categories");
    }
  };

  const generateRandomNumber = () => {
    return Math.floor(Math.random() * 90000000) + 10000000; // 8-digit random number
  };

  // Format file size to human readable format
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newImages: ImagePreview[] = [];
    let errorOccurred = false;
    let largeFilesCount = 0;

    Array.from(files).forEach((file, index) => {
      if (file.size > 10 * 1024 * 1024) {
        setError(`File ${file.name} is too large. Max size is 10MB`);
        errorOccurred = true;
        return;
      }

      const isLarge = file.size > 1 * 1024 * 1024; // > 1MB
      if (isLarge) {
        largeFilesCount++;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        newImages.push({
          file,
          preview: reader.result as string,
          id: `${Date.now()}-${index}`,
          size: file.size,
          sizeFormatted: formatFileSize(file.size),
          isLarge,
        });

        // When all files are processed
        if (newImages.length === files.length - (errorOccurred ? 1 : 0)) {
          setImages((prev) => [...prev, ...newImages]);
          
          // Show warning if large files detected
          if (largeFilesCount > 0 && !errorOccurred) {
            setError(
              `⚠️ Warning: ${largeFilesCount} image${largeFilesCount > 1 ? 's' : ''} ${largeFilesCount > 1 ? 'are' : 'is'} larger than 1MB. Consider compressing ${largeFilesCount > 1 ? 'them' : 'it'} to save storage space.`
            );
          } else if (!errorOccurred) {
            setError('');
          }
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (images.length === 0) {
      setError('Please select at least one image');
      return;
    }

    if (!title.trim()) {
      setError('Please enter a base title');
      return;
    }

    if (!category) {
      setError('Please select a category');
      return;
    }

    setLoading(true);
    setError('');
    setUploadResults([]);

    const results: UploadResult[] = [];
    const totalImages = images.length;

    // Upload images one by one with auto-generated titles
    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      const randomNum = generateRandomNumber();
      const imageTitle = `${title}-${randomNum}`;

      // Update progress
      setUploadProgress({
        total: totalImages,
        current: i + 1,
        currentFileName: imageTitle,
        percentage: Math.round(((i + 1) / totalImages) * 100),
      });

      const formData = new FormData();
      formData.append('title', imageTitle);
      formData.append('category', category);
      formData.append('image', image.file);

      try {
        await axiosInstance.post('/images/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        results.push({
          fileName: imageTitle,
          success: true,
        });
      } catch (err: any) {
        results.push({
          fileName: imageTitle,
          success: false,
          error: err.response?.data?.message || 'Upload failed',
        });
      }
    }

    setUploadResults(results);
    setUploadProgress(null);
    setLoading(false);

    // Check if all uploads were successful
    const allSuccess = results.every((r) => r.success);
    if (allSuccess) {
      setTitle('');
      setCategory('');
      setImages([]);

      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    }
  };

  const successCount = uploadResults.filter((r) => r.success).length;
  const failedCount = uploadResults.filter((r) => !r.success).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Upload Images</h1>
          <p className="text-gray-600 mt-2">
            Add multiple images to your collection with auto-generated titles
          </p>
        </div>

        {/* Upload Progress */}
        {uploadProgress && (
          <div className="mb-6 bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <Loader2 className="w-5 h-5 text-blue-600 mr-3 animate-spin" />
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    Uploading Images...
                  </h3>
                  <p className="text-xs text-gray-600 mt-0.5">
                    {uploadProgress.current} of {uploadProgress.total} images
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-blue-600">
                  {uploadProgress.percentage}%
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-3 mb-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${uploadProgress.percentage}%` }}
              />
            </div>

            {/* Current File */}
            <div className="flex items-center justify-between text-sm">
              <p className="text-gray-600">
                Current: <span className="font-medium text-gray-900">{uploadProgress.currentFileName}</span>
              </p>
              <p className="text-gray-500">
                {uploadProgress.current}/{uploadProgress.total}
              </p>
            </div>
          </div>
        )}

        {/* Upload Results */}
        {uploadResults.length > 0 && !loading && (
          <div className="mb-6 bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Upload Results</h3>
            <div className="space-y-3">
              {successCount > 0 && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-green-800 mb-2">
                        ✓ {successCount} image{successCount > 1 ? 's' : ''} uploaded successfully!
                      </p>
                      <div className="text-xs text-green-700 space-y-1 max-h-40 overflow-y-auto">
                        {uploadResults
                          .filter((r) => r.success)
                          .map((result, idx) => (
                            <div key={idx} className="flex items-center">
                              <CheckCircle className="w-3 h-3 mr-2 flex-shrink-0" />
                              {result.fileName}
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {failedCount > 0 && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-red-800 mb-2">
                        ✗ {failedCount} image{failedCount > 1 ? 's' : ''} failed to upload:
                      </p>
                      <div className="text-xs text-red-700 space-y-1 max-h-40 overflow-y-auto">
                        {uploadResults
                          .filter((r) => !r.success)
                          .map((result, idx) => (
                            <div key={idx} className="flex items-start">
                              <AlertCircle className="w-3 h-3 mr-2 flex-shrink-0 mt-0.5" />
                              <span>
                                <strong>{result.fileName}:</strong> {result.error}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Summary */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Total:</span> {uploadResults.length} images
                </div>
                <div className="flex items-center space-x-4 text-sm">
                  <span className="text-green-600 font-medium">
                    ✓ {successCount} success
                  </span>
                  {failedCount > 0 && (
                    <span className="text-red-600 font-medium">
                      ✗ {failedCount} failed
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error/Warning Message */}
        {error && (
          <div className={`mb-6 p-4 border rounded-lg flex items-start ${
            error.includes('⚠️ Warning') 
              ? 'bg-amber-50 border-amber-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <AlertCircle className={`w-5 h-5 mt-0.5 mr-3 flex-shrink-0 ${
              error.includes('⚠️ Warning') 
                ? 'text-amber-600' 
                : 'text-red-600'
            }`} />
            <p className={`text-sm ${
              error.includes('⚠️ Warning') 
                ? 'text-amber-800' 
                : 'text-red-800'
            }`}>{error}</p>
          </div>
        )}

        {/* Upload Form */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Base Title Input */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Base Title
              </label>
              <input
                id="title"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={loading}
                className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="e.g., cartoon (will become cartoon-12345678)"
              />
              <p className="mt-1 text-xs text-gray-500">
                Each image will be titled as: {title || 'title'}-[random-8-digits]
              </p>
            </div>

            {/* Category Selection */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                id="category"
                required
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={loading}
                className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">Select Category</option>
                {categories.length > 0 ? (
                  categories.map((cat: any) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))
                ) : (
                  <option disabled>Loading...</option>
                )}
              </select>
            </div>

            {/* Multiple Image Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Images (Multiple)
              </label>
              <div className="mt-2">
                <label
                  htmlFor="images"
                  className={`flex justify-center px-6 py-8 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer hover:border-blue-400 transition-colors bg-gray-50 hover:bg-gray-100 ${
                    loading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <div className="text-center">
                    <ImageIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <div className="flex text-sm text-gray-600">
                      <span className="relative font-medium text-blue-600 hover:text-blue-500">
                        Upload multiple files
                      </span>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">PNG, JPG, WEBP up to 10MB each</p>
                    {images.length > 0 && (
                      <p className="text-sm font-medium text-blue-600 mt-3">
                        {images.length} image{images.length > 1 ? 's' : ''} selected
                      </p>
                    )}
                  </div>
                  <input
                    id="images"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    disabled={loading}
                    className="sr-only"
                  />
                </label>
              </div>
            </div>

            {/* Image Previews */}
            {images.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900">
                    Selected Images ({images.length})
                  </h3>
                  <div className="text-xs text-gray-600">
                    Total Size: {formatFileSize(images.reduce((sum, img) => sum + img.size, 0))}
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {images.map((image, index) => (
                    <div
                      key={image.id}
                      className={`relative group border rounded-lg overflow-hidden bg-white ${
                        image.isLarge ? 'border-amber-300 ring-1 ring-amber-200' : 'border-gray-200'
                      }`}
                    >
                      {/* Large File Badge */}
                      {image.isLarge && (
                        <div className="absolute top-2 left-2 z-10">
                          <span className="inline-flex items-center px-2 py-1 bg-amber-500 text-white text-xs font-medium rounded">
                            ⚠️ Large
                          </span>
                        </div>
                      )}

                      {!loading && (
                        <button
                          type="button"
                          onClick={() => removeImage(image.id)}
                          className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100 z-10"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                      
                      <img
                        src={image.preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-32 object-cover"
                      />
                      
                      <div className={`p-2 border-t ${
                        image.isLarge ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-200'
                      }`}>
                        <p className="text-xs text-gray-600 truncate mb-1">
                          {title ? `${title}-${generateRandomNumber()}` : `Image ${index + 1}`}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-medium ${
                            image.isLarge ? 'text-amber-700' : 'text-gray-500'
                          }`}>
                            {image.sizeFormatted}
                          </span>
                          {image.isLarge && (
                            <span className="text-xs text-amber-600" title="Consider compressing this image">
                              📦
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Large Files Summary */}
                {images.some(img => img.isLarge) && (
                  <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs font-medium text-amber-900 mb-1">
                          Storage Optimization Tip
                        </p>
                        <p className="text-xs text-amber-700">
                          {images.filter(img => img.isLarge).length} image{images.filter(img => img.isLarge).length > 1 ? 's are' : ' is'} larger than 1MB. 
                          You can compress {images.filter(img => img.isLarge).length > 1 ? 'them' : 'it'} using tools like TinyPNG or Squoosh before uploading to save storage space.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center space-x-4 pt-4 border-t">
              <button
                type="submit"
                disabled={loading || images.length === 0}
                className="flex-1 flex items-center justify-center px-6 py-3 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    <span>
                      Uploading {uploadProgress?.current || 0}/{images.length}...
                    </span>
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5 mr-2" />
                    Upload {images.length > 0 ? `${images.length} ` : ''}Image
                    {images.length !== 1 ? 's' : ''}
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                disabled={loading}
                className="px-6 py-3 border border-gray-300 rounded-lg shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}