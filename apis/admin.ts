import type { LoginInput, LoginResponse } from '~/shared/schemas/auth.schema'
import { requester } from '~/utils/requester'

const client = requester()

export const AdminApi = {
  auth: {
    /**
     * User login
     */
    login: (data: LoginInput) => client.post<LoginResponse>('/api/admin/auth/login', data),
  },
}
