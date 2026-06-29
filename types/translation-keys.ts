import common from '../messages/en/common.json' with { type: 'json' }

type NestedKeyOf<T, Prefix extends string = ''> = T extends object
  ? {
      [K in keyof T & string]: T[K] extends object
        ? K extends string
          ? | `${Prefix}${K}`
          | NestedKeyOf<T[K], `${Prefix}${K}.`>
          : never
        : `${Prefix}${K}`;
    }[keyof T & string]
  : never

export type Namespace = 'common'

export interface Messages {
  common: typeof common
}

export interface TranslationKeys {
  common: NestedKeyOf<typeof common>
}

export interface TranslationParamsMap {
  common: {
    hello: void
    name: { name: string | number | boolean | Date | null | undefined }
  }
}

export type AllTranslationKeys = {
  [K in Namespace]: `${K}.${TranslationKeys[K]}`
}[Namespace]

type SplitPath<Path extends string>
  = Path extends `${infer N}.${infer K}`
    ? N extends Namespace
      ? K extends TranslationKeys[N]
        ? { namespace: N, key: K }
        : never
      : never
    : never

export type TranslationFunctionParams<N extends Namespace, K extends TranslationKeys[N]>
  = K extends keyof TranslationParamsMap[N]
    ? TranslationParamsMap[N][K]
    : void

export type GlobalTranslationParams<Path extends AllTranslationKeys>
  = SplitPath<Path> extends { namespace: infer N, key: infer K }
    ? N extends Namespace
      ? K extends TranslationKeys[N]
        ? TranslationFunctionParams<N, K>
        : void
      : void
    : void

declare global {
  interface IntlMessages extends Messages {}
}

export {}
