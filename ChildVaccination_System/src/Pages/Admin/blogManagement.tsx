import React, { useState, useEffect } from 'react';
import { createBlog, getBlogList, deleteBlog, updateBlog } from '../../api/blogApi';
// Nếu có các component Button, Input, Textarea riêng thì import đúng đường dẫn, nếu không thì dùng thẻ HTML mặc định

interface Blog {
  id: number;
  title: string;
  content: string;
  image?: string;
  category?: string;
  status?: string;
}

interface ApiBlog {
  blogId: number;
  title: string;
  content: string;
  image?: string;
  category?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

const BlogManagement: React.FC = () => {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [category, setCategory] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editCategory, setEditCategory] = useState('');
  // Đã xoá các biến editImage, editCategory, editStatus không dùng
  const [loading, setLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);
  const [error, setError] = useState('');

  // Load danh sách blog khi component mount
  useEffect(() => {
    const loadBlogs = async () => {
      try {
        const response = await getBlogList();
        console.log('Blog response received:', response); // Debug log
        
        // Truy cập data từ AxiosResponse
        const blogData = response.data || response;
        console.log('Processed blog data:', blogData); // Debug log thêm
        
        // Kiểm tra xem dữ liệu có phải là array không
        if (Array.isArray(blogData)) {
          // Map dữ liệu để phù hợp với interface Blog
          const mappedBlogs = blogData.map((blog: ApiBlog) => ({
            id: blog.blogId,
            title: blog.title,
            content: blog.content,
            image: blog.image,
            category: blog.category,
            status: blog.status
          }));
          setBlogs(mappedBlogs);
        } else if (blogData && Array.isArray(blogData.data)) {
          // Trường hợp API trả về object có thuộc tính data chứa array
          const mappedBlogs = blogData.data.map((blog: ApiBlog) => ({
            id: blog.blogId,
            title: blog.title,
            content: blog.content,
            image: blog.image,
            category: blog.category,
            status: blog.status
          }));
          setBlogs(mappedBlogs);
        } else if (blogData && Array.isArray(blogData.items)) {
          // Trường hợp API trả về object có thuộc tính items chứa array
          const mappedBlogs = blogData.items.map((blog: ApiBlog) => ({
            id: blog.blogId,
            title: blog.title,
            content: blog.content,
            image: blog.image,
            category: blog.category,
            status: blog.status
          }));
          setBlogs(mappedBlogs);
        } else {
          // Nếu không có dữ liệu hợp lệ, set empty array
          console.warn('Blog data không phải là array:', blogData);
          setBlogs([]);
        }
      } catch (error) {
        console.error('Lỗi khi tải danh sách blog:', error);
        setBlogs([]); // Đảm bảo blogs luôn là array
      }
    };
    
    loadBlogs();
  }, []);

  const handleAddBlog = async () => {
    setError('');
    if (!title.trim() || !content.trim()) {
      setError('Vui lòng nhập tiêu đề và nội dung.');
      return;
    }
    setLoading(true);
    try {
      const response = await createBlog({
        title,
        content,
        image,
        category,
        status: 'Published', // Tự động set status là published
      });
      
      // Truy cập data từ AxiosResponse
      const resData = response.data || response;
      
      // Thêm blog mới vào danh sách hiện tại
      setBlogs([
        ...blogs,
        {
          id: resData.id || Date.now(),
          title,
          content,
          image: resData.image || '',
          category,
          status: 'Published', // Tự động set status là published
        },
      ]);
      
      setTitle('');
      setContent('');
      setImage(null);
      setCategory('');
      setImagePreview(null);
    } catch (error: unknown) {
      console.error('Lỗi khi tạo blog:', error);
      setError('Tạo blog thất bại!');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBlog = async (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa blog này không?')) {
      return;
    }
    
    setDeleteLoading(id);
    try {
      await deleteBlog(id);
      // Chỉ xóa khỏi state sau khi API call thành công
      setBlogs(blogs.filter((blog) => blog.id !== id));
      console.log('Xóa blog thành công!');
    } catch (error) {
      console.error('Lỗi khi xóa blog:', error);
      setError('Xóa blog thất bại!');
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleEditBlog = (blog: Blog) => {
    setEditId(blog.id);
    setEditTitle(blog.title);
    setEditContent(blog.content);
    setEditCategory(blog.category || '');
  };

  const handleSaveEdit = async () => {
    if (editId === null) return;
    
    setEditLoading(true);
    try {
      await updateBlog(editId, {
        title: editTitle,
        content: editContent,
        category: editCategory,
        status: 'Published', // Luôn set là Published
      });
      
      // Cập nhật state local sau khi API thành công
      setBlogs(
        blogs.map((blog) =>
          blog.id === editId ? { 
            ...blog, 
            title: editTitle, 
            content: editContent, 
            category: editCategory 
          } : blog
        )
      );
      
      // Reset edit state
      setEditId(null);
      setEditTitle('');
      setEditContent('');
      setEditCategory('');
      
      console.log('Cập nhật blog thành công!');
    } catch (error) {
      console.error('Lỗi khi cập nhật blog:', error);
      setError('Cập nhật blog thất bại!');
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px', fontFamily: 'Arial, sans-serif' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px', textAlign: 'center' }}>
        <h1 style={{ color: '#1f2937', fontSize: '32px', fontWeight: 'bold', margin: '0 0 8px 0' }}>
          Quản lý Blog
        </h1>
        <p style={{ color: '#6b7280', fontSize: '16px', margin: 0 }}>
          Tạo và quản lý các bài viết blog của bạn
        </p>
      </div>

      {/* Create Blog Form */}
      <div style={{
        background: '#ffffff',
        padding: '32px',
        borderRadius: '12px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        marginBottom: '32px'
      }}>
        <h2 style={{ color: '#1f2937', fontSize: '24px', fontWeight: '600', marginBottom: '24px', display: 'flex', alignItems: 'center' }}>
          Tạo Blog Mới
        </h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
          {/* Left Column */}
          <div>
            <label style={{ display: 'block', color: '#374151', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
              Tiêu đề blog *
            </label>
            <input
              type="text"
              placeholder="Nhập tiêu đề blog..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '16px',
                outline: 'none',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
            
            <label style={{ display: 'block', color: '#374151', fontSize: '14px', fontWeight: '500', marginBottom: '8px', marginTop: '16px' }}>
              Danh mục
            </label>
            <input
              type="text"
              placeholder="Nhập danh mục..."
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '16px',
                outline: 'none',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>

          {/* Right Column */}
          <div>
            <label style={{ display: 'block', color: '#374151', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
              Hình ảnh
            </label>
            <div style={{
              border: '2px dashed #d1d5db',
              borderRadius: '8px',
              padding: '24px',
              textAlign: 'center',
              background: '#f9fafb',
              transition: 'border-color 0.2s'
            }}>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files && e.target.files[0] ? e.target.files[0] : null;
                  setImage(file);
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      setImagePreview(reader.result as string);
                    };
                    reader.readAsDataURL(file);
                  } else {
                    setImagePreview(null);
                  }
                }}
                style={{ display: 'none' }}
                id="imageInput"
              />
              <label htmlFor="imageInput" style={{
                display: 'block',
                cursor: 'pointer',
                color: '#6b7280'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '8px' }}>+</div>
                <div style={{ fontSize: '14px', fontWeight: '500' }}>
                  Nhấp để chọn ảnh
                </div>
                <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
                  PNG, JPG, GIF tối đa 10MB
                </div>
              </label>
            </div>
            
            {imagePreview && (
              <div style={{ marginTop: '16px', textAlign: 'center' }}>
                <img 
                  src={imagePreview} 
                  alt="Xem trước ảnh" 
                  style={{ 
                    maxWidth: '100%', 
                    maxHeight: '200px', 
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }} 
                />
                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px' }}>
                  Xem trước ảnh
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div>
          <label style={{ display: 'block', color: '#374151', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
            Nội dung blog *
          </label>
          <textarea
            placeholder="Viết nội dung blog của bạn..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            style={{
              width: '100%',
              minHeight: '120px',
              padding: '16px',
              border: '2px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '16px',
              outline: 'none',
              transition: 'border-color 0.2s',
              resize: 'vertical',
              fontFamily: 'inherit',
              boxSizing: 'border-box'
            }}
            onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
          />
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            background: '#fef2f2',
            color: '#dc2626',
            padding: '12px 16px',
            borderRadius: '8px',
            marginTop: '16px',
            border: '1px solid #fecaca',
            display: 'flex',
            alignItems: 'center'
          }}>
            <span style={{ marginRight: '8px' }}>!</span>
            {error}
          </div>
        )}

        {/* Submit Button */}
        <div style={{ marginTop: '24px', textAlign: 'right' }}>
          <button 
            onClick={handleAddBlog} 
            disabled={loading}
            style={{
              background: loading ? '#9ca3af' : '#3b82f6',
              color: '#ffffff',
              padding: '12px 32px',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              marginLeft: 'auto'
            }}
            onMouseEnter={(e) => {
              if (!loading) (e.target as HTMLButtonElement).style.background = '#2563eb';
            }}
            onMouseLeave={(e) => {
              if (!loading) (e.target as HTMLButtonElement).style.background = '#3b82f6';
            }}
          >
            {loading ? (
              <>
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid #ffffff',
                  borderTop: '2px solid transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  marginRight: '8px'
                }}></div>
                Đang tạo...
              </>
            ) : (
              <>
                <span style={{ marginRight: '8px' }}>+</span>
                Tạo Blog
              </>
            )}
          </button>
        </div>
      </div>
      {/* Blog List */}
      <div>
        <h2 style={{ 
          color: '#1f2937', 
          fontSize: '24px', 
          fontWeight: '600', 
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center'
        }}>
          Danh sách Blog
        </h2>
        
        {blogs.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '48px',
            background: '#f9fafb',
            borderRadius: '12px',
            border: '2px dashed #d1d5db'
          }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>□</div>
            <h3 style={{ color: '#6b7280', fontSize: '18px', margin: '0 0 8px 0' }}>
              Chưa có blog nào
            </h3>
            <p style={{ color: '#9ca3af', fontSize: '14px', margin: 0 }}>
              Hãy tạo blog đầu tiên của bạn bằng form bên trên
            </p>
          </div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', 
            gap: '24px' 
          }}>
            {blogs.map((blog) => (
              <div key={blog.id} style={{
                background: '#ffffff',
                borderRadius: '12px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                overflow: 'hidden',
                transition: 'transform 0.2s, box-shadow 0.2s',
                cursor: 'default'
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)';
                (e.currentTarget as HTMLElement).style.boxShadow = '0 10px 25px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
              }}>
                {editId === blog.id ? (
                  <div style={{ padding: '24px' }}>
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', color: '#374151', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                        Tiêu đề
                      </label>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        disabled={editLoading}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: '2px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '16px',
                          outline: 'none',
                          boxSizing: 'border-box',
                          backgroundColor: editLoading ? '#f9fafb' : 'white'
                        }}
                      />
                    </div>
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', color: '#374151', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                        Danh mục
                      </label>
                      <input
                        type="text"
                        value={editCategory}
                        onChange={(e) => setEditCategory(e.target.value)}
                        disabled={editLoading}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: '2px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '16px',
                          outline: 'none',
                          boxSizing: 'border-box',
                          backgroundColor: editLoading ? '#f9fafb' : 'white'
                        }}
                      />
                    </div>
                    <div style={{ marginBottom: '20px' }}>
                      <label style={{ display: 'block', color: '#374151', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                        Nội dung
                      </label>
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        disabled={editLoading}
                        style={{
                          width: '100%',
                          minHeight: '100px',
                          padding: '12px 16px',
                          border: '2px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '14px',
                          outline: 'none',
                          resize: 'vertical',
                          fontFamily: 'inherit',
                          boxSizing: 'border-box',
                          backgroundColor: editLoading ? '#f9fafb' : 'white'
                        }}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button 
                        onClick={handleSaveEdit} 
                        disabled={editLoading}
                        style={{
                          flex: 1,
                          padding: '10px 16px',
                          background: editLoading ? '#9ca3af' : '#10b981',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '14px',
                          fontWeight: '600',
                          cursor: editLoading ? 'not-allowed' : 'pointer',
                          transition: 'background 0.2s',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        onMouseEnter={(e) => {
                          if (!editLoading) (e.target as HTMLButtonElement).style.background = '#059669';
                        }}
                        onMouseLeave={(e) => {
                          if (!editLoading) (e.target as HTMLButtonElement).style.background = '#10b981';
                        }}
                      >
                        {editLoading ? (
                          <>
                            <div style={{
                              width: '14px',
                              height: '14px',
                              border: '2px solid #ffffff',
                              borderTop: '2px solid transparent',
                              borderRadius: '50%',
                              animation: 'spin 1s linear infinite',
                              marginRight: '6px'
                            }}></div>
                            Đang lưu...
                          </>
                        ) : (
                          'Lưu'
                        )}
                      </button>
                      <button 
                        onClick={() => {
                          setEditId(null);
                          setEditTitle('');
                          setEditContent('');
                          setEditCategory('');
                        }} 
                        disabled={editLoading}
                        style={{
                          flex: 1,
                          padding: '10px 16px',
                          background: editLoading ? '#9ca3af' : '#6b7280',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '14px',
                          fontWeight: '600',
                          cursor: editLoading ? 'not-allowed' : 'pointer',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          if (!editLoading) (e.target as HTMLButtonElement).style.background = '#4b5563';
                        }}
                        onMouseLeave={(e) => {
                          if (!editLoading) (e.target as HTMLButtonElement).style.background = '#6b7280';
                        }}
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Image */}
                    {blog.image && (
                      <div style={{ height: '200px', overflow: 'hidden' }}>
                        <img 
                          src={blog.image} 
                          alt={blog.title}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                        />
                      </div>
                    )}
                    
                    {/* Content */}
                    <div style={{ padding: '24px' }}>
                      {/* Categories and Status */}
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                        {blog.category && (
                          <span style={{
                            background: '#dbeafe',
                            color: '#1e40af',
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '500'
                          }}>
                            {blog.category}
                          </span>
                        )}
                        {blog.status && (
                          <span style={{
                            background: blog.status === 'published' ? '#dcfce7' : blog.status === 'draft' ? '#fef3c7' : '#f3f4f6',
                            color: blog.status === 'published' ? '#166534' : blog.status === 'draft' ? '#92400e' : '#374151',
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '500'
                          }}>
                            {blog.status}
                          </span>
                        )}
                      </div>
                      
                      {/* Title */}
                      <h3 style={{
                        color: '#1f2937',
                        fontSize: '18px',
                        fontWeight: '600',
                        margin: '0 0 12px 0',
                        lineHeight: '1.4'
                      }}>
                        {blog.title}
                      </h3>
                      
                      {/* Content Preview */}
                      <p style={{
                        color: '#6b7280',
                        fontSize: '14px',
                        lineHeight: '1.6',
                        margin: '0 0 20px 0',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {blog.content}
                      </p>
                      
                      {/* Actions */}
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <button 
                          onClick={() => handleEditBlog(blog)} 
                          style={{
                            flex: 1,
                            padding: '10px 16px',
                            background: '#f59e0b',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'background 0.2s'
                          }}
                          onMouseEnter={(e) => (e.target as HTMLButtonElement).style.background = '#d97706'}
                          onMouseLeave={(e) => (e.target as HTMLButtonElement).style.background = '#f59e0b'}
                        >
                          Sửa
                        </button>
                        <button 
                          onClick={() => handleDeleteBlog(blog.id)} 
                          disabled={deleteLoading === blog.id}
                          style={{
                            flex: 1,
                            padding: '10px 16px',
                            background: deleteLoading === blog.id ? '#9ca3af' : '#ef4444',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: deleteLoading === blog.id ? 'not-allowed' : 'pointer',
                            transition: 'background 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          onMouseEnter={(e) => {
                            if (deleteLoading !== blog.id) (e.target as HTMLButtonElement).style.background = '#dc2626';
                          }}
                          onMouseLeave={(e) => {
                            if (deleteLoading !== blog.id) (e.target as HTMLButtonElement).style.background = '#ef4444';
                          }}
                        >
                          {deleteLoading === blog.id ? (
                            <>
                              <div style={{
                                width: '14px',
                                height: '14px',
                                border: '2px solid #ffffff',
                                borderTop: '2px solid transparent',
                                borderRadius: '50%',
                                animation: 'spin 1s linear infinite',
                                marginRight: '6px'
                              }}></div>
                              Đang xóa...
                            </>
                          ) : (
                            'Xóa'
                          )}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CSS Animation for Loading Spinner */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default BlogManagement;
