import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { findPublicMaterials } from '~/server/application/content/public-material.query'
import { HomePageClient } from './HomePageClient'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('common')

  return {
    title: t('home.hero.title'),
    description: t('home.hero.description'),
    openGraph: {
      title: t('home.hero.title'),
      description: t('home.hero.description'),
      type: 'website',
    },
  }
}

export default async function HomePage() {
  const result = await findPublicMaterials({ page: 1, pageSize: 3 })
  const materials = result.data.map(material => ({
    id: material.id,
    title: material.title,
    summary: material.summary,
    category: material.category,
    categoryName: material.categoryName,
    coverUrl: material.coverUrl,
    createdAt: material.createdAt.toISOString(),
  }))

  return <HomePageClient materials={materials} />
}
