import { notFound } from 'next/navigation'
import { redirect } from '~/lib/i18n/navigation'

interface DetailsPageProps {
  params: Promise<{
    locale: string
  }>
  searchParams: Promise<{
    id?: string
  }>
}

export default async function DetailsPage({ params, searchParams }: DetailsPageProps) {
  const { locale } = await params
  const { id } = await searchParams

  if (!id)
    notFound()

  redirect({
    href: `/details/${id}`,
    locale,
  })
}
