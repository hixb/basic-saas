import { handleLogout } from '~/server/interfaces/http/auth/login.handler'

export async function POST() {
  return handleLogout()
}
