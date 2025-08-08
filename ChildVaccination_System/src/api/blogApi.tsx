import axiosClient from "./axiosClient";

export async function getBlogList() {
  return await axiosClient.get('api/Blog');
}

export async function deleteBlog(blogId: number) {
  return await axiosClient.delete(`api/Blog/${blogId}`);
}

export async function updateBlog(blogId: number, { title, content, image, category, status }: {
  title: string;
  content: string;
  image?: File | null;
  category: string;
  status: string;
}) {
  const formData = new FormData();
  formData.append('Title', title);
  formData.append('Content', content);
  if (image) {
    formData.append('Image', image);
  } else {
    formData.append('Image', '');
  }
  formData.append('Category', category);
  formData.append('Status', status);

  return await axiosClient.put(`api/Blog/${blogId}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}

export async function createBlog({ title, content, image, category, status }: {
  title: string;
  content: string;
  image: File | null;
  category: string;
  status: string;
}) {
  const formData = new FormData();
  formData.append('Title', title);
  formData.append('Content', content);
  formData.append('Image', image || '');
  formData.append('Category', category);
  formData.append('Status', status);

  return await axiosClient.post('api/Blog', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}
