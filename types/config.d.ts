/**
 * 主题值类型
 * @description 定义应用支持的主题模式
 * - light: 浅色主题
 * - dark: 深色主题
 * - system: 跟随系统主题
 */
type ThemeValue = 'light' | 'dark' | 'system'

/**
 * 网站配置接口
 * @description 定义整个应用的全局配置结构
 */
interface WebsiteConfig {
  /**
   * 网站标题
   * @description 用于网站标题和浏览器标签的标题
   * @example 'My Website'
   */
  siteName: string
  /**
   * 国际化配置
   * @description 配置应用的多语言支持
   */
  i18n: {
    /**
     * 默认语言
     * @description 当用户没有选择语言时使用的默认语言代码
     * @example 'en', 'zh', 'ja'
     */
    defaultLocale: string

    /**
     * 支持的语言列表
     * @description 定义应用支持的所有语言及其配置
     * @example
     * {
     *   en: { flag: 'en', name: 'English', hreflang: 'en' },
     *   zh: { flag: 'zh', name: '中文', hreflang: 'zh-CN' }
     * }
     */
    locales: {
      /**
       * 语言配置项
       * @description 每个语言的详细配置
       */
      [locale: string]: {
        /**
         * 国旗图标标识
         * @description 用于显示国旗图标的标识符，通常对应 /public/flag/{flag}.svg 文件
         * @example 'en', 'zh', 'ja'
         */
        flag: string

        /**
         * 语言显示名称
         * @description 在语言切换器中显示的语言名称
         * @example 'English', '中文', '日本語'
         */
        name: string

        /**
         * HTML hreflang 属性
         * @description 用于 SEO 的语言标识，符合 BCP 47 标准
         * @example 'en', 'zh-CN', 'ja-JP'
         * @see https://www.w3.org/International/questions/qa-html-language-declarations
         */
        hreflang: string
      }
    }
  }

  /**
   * 主题配置
   * @description 配置应用的主题系统
   */
  theme: {
    /**
     * 默认主题
     * @description 应用首次加载时使用的默认主题
     * @default 'system'
     */
    defaultTheme: ThemeValue

    /**
     * 是否显示主题切换器
     * @description 控制主题切换器组件是否在界面中显示
     * @default true
     */
    showSwitcher: boolean
  }
}
