import type { LoginInput, LoginResponse } from '~/shared/schemas/auth.schema'
import type { CreateInquiryInput, CreateMaterialInput, MaterialCategoryInput, SensitiveWordInput } from '~/shared/schemas/content.schema'
import type { PublishRequestInput } from '~/shared/schemas/publish.schema'
import type { SocialPlatformConfigInput } from '~/shared/schemas/social-platform.schema'
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

export interface AnalyticsOverviewResponse {
  metrics: {
    sessions: number
    events: number
    replaySessions: number
    countries: number
  }
  sessionTrend: Array<{ date: string, sessions: number, events: number }>
  topCountries: Array<{ country: string, value: number }>
  topPages: Array<{ path: string, value: number }>
}

export interface AnalyticsReplayUrl {
  chunkIndex: number
  contentType: string
  eventCount: number
  size: number
  key: string
  url: string
  expiresAt: string
}

export interface AnalyticsReplayDiagnostics {
  chunks: number
  failedChunks: Array<{ chunkIndex: number, message: string }>
  failedChunkCount: number
  eventCount: number
  typeCounts: Record<string, number>
  hasMeta: boolean
  hasFullSnapshot: boolean
  firstTimestamp: number | null
  lastTimestamp: number | null
  firstTypes: unknown[]
  meta: unknown
  fullSnapshotNodeType: unknown
}

export interface PublishResult {
  platform: 'facebook' | 'youtube'
  accountId: number
  status: 'published' | 'skipped' | 'failed'
  message: string
  remoteId?: string
  detail?: unknown
}

export interface PublishResponse {
  results: PublishResult[]
  suitability: Array<{
    platform: string
    suitable: boolean
    reason: string
  }>
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
    publish: (data: PublishRequestInput) => client.post<PublishResponse>('/api/admin/publish', data),
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
  socialPlatforms: {
    list: (query: Record<string, unknown>) => client.get<any[]>('/api/admin/social-platforms', query) as Promise<PaginatedResponse<any>>,
    active: () => client.get<any[]>('/api/admin/social-platforms', { activeOnly: true }) as Promise<PaginatedResponse<any>>,
    create: (data: SocialPlatformConfigInput) => client.post('/api/admin/social-platforms', data),
    update: (id: number, data: Partial<SocialPlatformConfigInput>) => client.put(`/api/admin/social-platforms/${id}`, data),
    delete: (id: number) => client.del(`/api/admin/social-platforms/${id}`),
  },
  sensitiveWords: {
    list: (query: Record<string, unknown>) => client.get<any[]>('/api/admin/sensitive-words', query) as Promise<PaginatedResponse<any>>,
    create: (data: SensitiveWordInput) => client.post('/api/admin/sensitive-words', data),
    update: (id: number, data: Partial<SensitiveWordInput>) => client.put(`/api/admin/sensitive-words/${id}`, data),
    delete: (id: number) => client.del(`/api/admin/sensitive-words/${id}`),
  },
  analytics: {
    overview: () => client.get<AnalyticsOverviewResponse>('/api/admin/analytics/overview'),
    sessions: (query: Record<string, unknown>) => client.get<any[]>('/api/admin/analytics/sessions', query) as Promise<PaginatedResponse<any>>,
    detail: (sessionId: string) => client.get<any>(`/api/admin/analytics/sessions/${sessionId}`),
    replayUrls: (sessionId: string) => client.get<{ sessionId: string, urls: AnalyticsReplayUrl[] }>(`/api/admin/analytics/sessions/${sessionId}/replay-urls`),
    replayEvents: (sessionId: string) => client.get<{ sessionId: string, events: any[], chunks: number, diagnostics: AnalyticsReplayDiagnostics }>(`/api/admin/analytics/sessions/${sessionId}/replay-events`),
    deleteSession: (sessionId: string) => client.del(`/api/admin/analytics/sessions/${sessionId}`),
  },
  public: {
    createInquiry: (data: CreateInquiryInput) => client.post('/api/public/inquiries', data),
    listMaterials: (query: Record<string, unknown>) => client.get<any[]>('/api/public/materials/list', query) as Promise<PaginatedResponse<any>>,
    getMaterial: (id: number) => client.get<any>(`/api/public/materials/${id}`),
  },
}
