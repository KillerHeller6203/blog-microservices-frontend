import axios, {
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
  AxiosError
} from "axios";

/* =======================
   TYPES
======================= */

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  expiresIn: number;
}

export interface Category {
  id: string;
  name: string;
  postCount?: number;
}

export interface Tag {
  id: string;
  name: string;
  postCount?: number;
}

export enum PostStatus {
  DRAFT = "DRAFT",
  PUBLISHED = "PUBLISHED"
}

export interface Post {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  status?: PostStatus;
  category: Category;
  tags: Tag[];
  editable?: boolean;
}

export interface CreatePostRequest {
  title: string;
  content: string;
  categoryId: string;
  tagIds: string[];
  status: PostStatus;
}

export interface UpdatePostRequest extends CreatePostRequest {
  id: string;
}

export interface ApiError {
  status: number;
  message: string;
}

/* =======================
   API SERVICE
======================= */

class ApiService {
  private api: AxiosInstance;
  private static instance: ApiService;

  private constructor() {
    this.api = axios.create({
      baseURL: "http://localhost:8080",
      headers: {
        "Content-Type": "application/json"
      }
    });

    //* ===== REQUEST INTERCEPTOR ===== */
     this.api.interceptors.request.use(
       (config: InternalAxiosRequestConfig) => {
         const token = localStorage.getItem("token");

         if (token) {
           config.headers.Authorization = `Bearer ${token}`;
         } else {
           delete config.headers.Authorization;
         }

         return config;
       },
       (error: AxiosError) => Promise.reject(error)
     );



    /* ===== RESPONSE INTERCEPTOR ===== */
    this.api.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        const status = error.response?.status;
        const url = error.config?.url ?? "";

        if (status === 401 && !url.includes("/login")) {
          localStorage.removeItem("token");
          window.location.href = "/login";
        }

        return Promise.reject(this.handleError(error));
      }
    );

  }

  public async getDraftPosts(): Promise<Post[]> {
    const response: AxiosResponse<Post[]> =
      await this.api.get("/api/v1/posts/drafts");
    return response.data;
  }

  public static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  private handleError(error: AxiosError): ApiError {
    return {
      status: error.response?.status || 500,
      message:
        (error.response?.data as any)?.message ||
        "An unexpected error occurred"
    };
  }

  /* =======================
     AUTH (USER SERVICE)
  ======================= */

  public async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response: AxiosResponse<AuthResponse> =
      await this.api.post("/api/users/login", credentials);

//     localStorage.setItem("token", response.data.token);
    return response.data;
  }
  public async register(data: RegisterRequest): Promise<void> {
    await this.api.post("/api/users/register", data);
  }

  public logout(): void {
    localStorage.removeItem("token");
  }

  /* =======================
     POSTS (POST SERVICE)
  ======================= */

  public async getPosts(params?: {
    categoryId?: string;
    tagId?: string;
  }): Promise<Post[]> {
    const response: AxiosResponse<Post[]> =
      await this.api.get("/api/v1/posts", { params });
    return response.data;
  }

  public async getPost(id: string): Promise<Post> {
    const response: AxiosResponse<Post> =
      await this.api.get(`/api/v1/posts/${id}`);
    return response.data;
  }

  public async createPost(post: CreatePostRequest): Promise<Post> {
    const response: AxiosResponse<Post> =
      await this.api.post("/api/v1/posts", post);
    return response.data;
  }

  public async updatePost(
    id: string,
    post: UpdatePostRequest
  ): Promise<Post> {
    const response: AxiosResponse<Post> =
      await this.api.put(`/api/v1/posts/${id}`, post);
    return response.data;
  }

  public async deletePost(id: string): Promise<void> {
    await this.api.delete(`/api/v1/posts/${id}`);
  }

  /* =======================
     CATEGORIES
  ======================= */

  public async getCategories(): Promise<Category[]> {
    const response: AxiosResponse<Category[]> =
      await this.api.get("/categories");
    return response.data;
  }

  public async createCategory(name: string): Promise<Category> {
    const response: AxiosResponse<Category> =
      await this.api.post("/categories", { name });
    return response.data;
  }

  public async updateCategory(
    id: string,
    name: string
  ): Promise<Category> {
    const response: AxiosResponse<Category> =
      await this.api.put(`/categories/${id}`, { id, name });
    return response.data;
  }

  public async deleteCategory(id: string): Promise<void> {
    await this.api.delete(`/categories/${id}`);
  }

  /* =======================
     TAGS
  ======================= */

  public async getTags(): Promise<Tag[]> {
    const response: AxiosResponse<Tag[]> =
      await this.api.get("/tags");
    return response.data;
  }

  public async createTags(names: string[]): Promise<void> {
    for (const name of names) {
      await this.api.post("/tags", { name });
    }
  }

  public async deleteTag(id: string): Promise<void> {
    await this.api.delete(`/tags/${id}`);
  }
}

/* =======================
   EXPORT SINGLETON
======================= */

export const apiService = ApiService.getInstance();
