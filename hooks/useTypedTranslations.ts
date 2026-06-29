import type { ReactNode } from 'react'
import type {
  AllTranslationKeys,
  GlobalTranslationParams,
  Namespace,
  TranslationFunctionParams,
  TranslationKeys,
} from '~/types/translation-keys'
import { useTranslations as useNextIntlTranslations } from 'next-intl'
import { useMemo } from 'react'

export function useTypedTranslations<N extends Namespace>(namespace: N): {
  <K extends TranslationKeys[N]>(
    key: K,
    ...args: TranslationFunctionParams<N, K> extends void
      ? [values?: never]
      : [values: TranslationFunctionParams<N, K>]
  ): string
  rich: <K extends TranslationKeys[N]>(
    key: K,
    ...args: TranslationFunctionParams<N, K> extends void
      ? [values?: Record<string, (chunks: any) => ReactNode>]
      : [values: TranslationFunctionParams<N, K> | Record<string, (chunks: any) => ReactNode>]
  ) => ReactNode
}

export function useTypedTranslations(): {
  <K extends AllTranslationKeys>(
    key: K,
    ...args: GlobalTranslationParams<K> extends void
      ? [values?: never]
      : [values: GlobalTranslationParams<K>]
  ): string
  rich: <K extends AllTranslationKeys>(
    key: K,
    ...args: GlobalTranslationParams<K> extends void
      ? [values?: Record<string, (chunks: any) => ReactNode>]
      : [values: GlobalTranslationParams<K> | Record<string, (chunks: any) => ReactNode>]
  ) => ReactNode
}

export function useTypedTranslations<N extends Namespace>(namespace?: N) {
  const t = useNextIntlTranslations(namespace as any)

  return useMemo(() => {
    const translate = (key: any, ...args: any[]): string => {
      return t(key, args[0])
    }

    translate.rich = (key: any, ...args: any[]): ReactNode => {
      return t.rich(key, args[0])
    }

    return translate
  }, [t])
}
