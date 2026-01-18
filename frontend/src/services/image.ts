import { useAuthStore } from '@/stores/authStore';

export interface ImageVariantResponse {
  variant_type: string;
  public_url: string;
  width: number;
  height: number;
  file_size: number;
  format: string;
}

export interface ImageResponse {
  id: string;
  filename: string;
  mime_type: string;
  width: number;
  height: number;
  file_size: number;
  public_url: string;
  variants: ImageVariantResponse[];
  thumbnails?: {
    small?: string;
    medium?: string;
    large?: string;
  };
  scene_description?: string;
  detected_text?: string;
  tags: string[];
  description?: string;
  processing_status: string;
  created_at: string;
}

class ImageService {
  private get baseUrl() {
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
  }

  private get headers() {
    const token = useAuthStore.getState().token;
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  private get uploadHeaders() {
    const token = useAuthStore.getState().token;
    return {
      'Authorization': `Bearer ${token}`,
    };
  }

  private transformImage(image: any): ImageResponse {
    const thumbnails: any = {};
    if (image.variants) {
      image.variants.forEach((v: ImageVariantResponse) => {
        if (v.variant_type === 'thumbnail_small') thumbnails.small = v.public_url;
        if (v.variant_type === 'thumbnail_medium') thumbnails.medium = v.public_url;
        if (v.variant_type === 'thumbnail_large') thumbnails.large = v.public_url;
      });
    }
    return { ...image, thumbnails, tags: image.tags || [] };
  }

  async uploadImage(file: File): Promise<ImageResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${this.baseUrl}/images/upload`, {
      method: 'POST',
      headers: this.uploadHeaders,
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to upload image');
    }

    const data = await response.json();
    return this.transformImage(data);
  }

  async listImages(skip: number = 0, limit: number = 100): Promise<ImageResponse[]> {
    const response = await fetch(`${this.baseUrl}/images/?skip=${skip}&limit=${limit}`, {
      method: 'GET',
      headers: this.headers,
    });

    if (!response.ok) {
      throw new Error('Failed to fetch images');
    }

    const data = await response.json();
    return data.map((img: any) => this.transformImage(img));
  }

  async getImage(imageId: string): Promise<ImageResponse> {
    const response = await fetch(`${this.baseUrl}/images/${imageId}`, {
      method: 'GET',
      headers: this.headers,
    });

    if (!response.ok) {
      throw new Error('Failed to fetch image');
    }

    const data = await response.json();
    return this.transformImage(data);
  }

  async deleteImage(imageId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/images/${imageId}`, {
      method: 'DELETE',
      headers: this.headers,
    });

    if (!response.ok) {
      throw new Error('Failed to delete image');
    }
  }

  async batchAction(action: 'delete' | 'tag', imageIds: string[], tags?: string[]): Promise<any> {
    const response = await fetch(`${this.baseUrl}/images/batch`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({ action, image_ids: imageIds, tags }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || `Failed to perform ${action} action`);
    }

    return response.json();
  }

  async searchImages(query: string, limit: number = 10): Promise<ImageResponse[]> {
    const response = await fetch(`${this.baseUrl}/images/search?query=${encodeURIComponent(query)}&limit=${limit}`, {
      method: 'GET',
      headers: this.headers,
    });

    if (!response.ok) {
      throw new Error('Failed to search images');
    }

    const data = await response.json();
    return data.map((img: any) => this.transformImage(img));
  }
}

export const imageService = new ImageService();
