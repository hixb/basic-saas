import type { LoginInput, LoginResponse } from '~/shared/schemas/auth.schema'
import type { CreateInquiryInput, CreateMaterialInput, MaterialCategoryInput, SensitiveWordInput } from '~/shared/schemas/content.schema'
import type { ApiResponse, PaginatedResponse } from '~/shared/types/api.type'
import { requester } from '~/utils/requester'

const client = requester()

export interface MaterialUploadResponse {
  key: string
  name: string
  size: number
  contentType: string
  url: string
}

export const AdminApi = {
  auth: {
    /**
     * User login
     */
    login: (data: LoginInput) => client.post<LoginResponse>('/api/admin/auth/login', data),
    logout: () => client.post<null>('/api/admin/auth/logout'),
  },
  users: {
    list: (query: Record<string, unknown>) => client.get<any[]>('/api/admin/users', query) as Promise<PaginatedResponse<any>>,
  },
  inquiries: {
    list: (query: Record<string, unknown>) => client.get<any[]>('/api/admin/inquiries', query) as Promise<PaginatedResponse<any>>,
  },
  materials: {
    list: (query: Record<string, unknown>) => client.get<any[]>('/api/admin/materials', query) as Promise<PaginatedResponse<any>>,
    get: (id: number) => client.get<any>(`/api/admin/materials/${id}`),
    create: (data: CreateMaterialInput) => client.post('/api/admin/materials', data),
    update: (id: number, data: Partial<CreateMaterialInput>) => client.put(`/api/admin/materials/${id}`, data),
    delete: (id: number) => client.del(`/api/admin/materials/${id}`),
    exportUrl: (query: Record<string, unknown>) => {
      const searchParams = new URLSearchParams()
      for (const [key, value] of Object.entries(query)) {
        if (value != null && value !== '')
          searchParams.set(key, String(value))
      }

      const qs = searchParams.toString()
      return `/api/admin/materials/export${qs ? `?${qs}` : ''}`
    },
    upload: async (file: File): Promise<ApiResponse<MaterialUploadResponse>> => {
      const formData = new FormData()
      formData.set('file', file)

      return client.post<MaterialUploadResponse, FormData>('/api/admin/materials/upload', formData)
    },
  },
  materialCategories: {
    list: (query: Record<string, unknown>) => client.get<any[]>('/api/admin/material-categories', query) as Promise<PaginatedResponse<any>>,
    active: () => client.get<any[]>('/api/admin/material-categories', { activeOnly: true }),
    create: (data: MaterialCategoryInput) => client.post('/api/admin/material-categories', data),
    update: (id: number, data: Partial<MaterialCategoryInput>) => client.put(`/api/admin/material-categories/${id}`, data),
    delete: (id: number) => client.del(`/api/admin/material-categories/${id}`),
  },
  sensitiveWords: {
    list: (query: Record<string, unknown>) => client.get<any[]>('/api/admin/sensitive-words', query) as Promise<PaginatedResponse<any>>,
    create: (data: SensitiveWordInput) => client.post('/api/admin/sensitive-words', data),
    update: (id: number, data: Partial<SensitiveWordInput>) => client.put(`/api/admin/sensitive-words/${id}`, data),
    delete: (id: number) => client.del(`/api/admin/sensitive-words/${id}`),
  },
  public: {
    createInquiry: (data: CreateInquiryInput) => client.post('/api/public/inquiries', data),
    listMaterials: (query: Record<string, unknown>) => client.get<any[]>('/api/public/materials/list', query) as Promise<PaginatedResponse<any>>,
    getMaterial: (id: number) => client.get<any>(`/api/public/materials/${id}`),
  },
}
