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
    'hello': void
    'name': { name: string | number | boolean | Date | null | undefined }
    'switcher.language.title': void
    'switcher.language.ariaLabel': void
    'switcher.theme.title': void
    'switcher.theme.ariaLabel': void
    'switcher.theme.light': void
    'switcher.theme.dark': void
    'switcher.theme.system': void
    'home.brand': void
    'home.nav.features': void
    'home.nav.materials': void
    'home.nav.faq': void
    'home.nav.admin': void
    'home.nav.platform': void
    'home.nav.specialties': void
    'home.nav.insights': void
    'home.nav.contact': void
    'home.hero.badge': void
    'home.hero.title': void
    'home.hero.description': void
    'home.hero.primary': void
    'home.hero.secondary': void
    'home.hero.panelLabel': void
    'home.hero.panelTitle': void
    'home.hero.panelStatus': void
    'home.metrics.orders': void
    'home.metrics.countries': void
    'home.metrics.sla': void
    'home.features.eyebrow': void
    'home.features.title': void
    'home.features.catalog.title': void
    'home.features.catalog.description': void
    'home.features.fulfillment.title': void
    'home.features.fulfillment.description': void
    'home.features.compliance.title': void
    'home.features.compliance.description': void
    'home.workflow.eyebrow': void
    'home.workflow.title': void
    'home.workflow.description': void
    'home.workflow.steps.connect.title': void
    'home.workflow.steps.connect.description': void
    'home.workflow.steps.prepare.title': void
    'home.workflow.steps.prepare.description': void
    'home.workflow.steps.ship.title': void
    'home.workflow.steps.ship.description': void
    'home.materials.eyebrow': void
    'home.materials.title': void
    'home.materials.description': void
    'home.materials.cta': void
    'home.materials.empty': void
    'home.form.eyebrow': void
    'home.form.title': void
    'home.form.description': void
    'home.form.name': void
    'home.form.company': void
    'home.form.email': void
    'home.form.phone': void
    'home.form.descriptionLabel': void
    'home.form.descriptionPlaceholder': void
    'home.form.submit': void
    'home.form.success': void
    'home.form.points.free': void
    'home.form.points.response': void
    'home.form.points.secure': void
    'home.faq.eyebrow': void
    'home.faq.title': void
    'home.faq.items.0.question': void
    'home.faq.items.0.answer': void
    'home.faq.items.1.question': void
    'home.faq.items.1.answer': void
    'home.faq.items.2.question': void
    'home.faq.items.2.answer': void
    'home.faq.items.3.question': void
    'home.faq.items.3.answer': void
    'home.channels.label': void
    'home.quote': void
    'home.specialties.title': void
    'home.specialties.items.catalog': void
    'home.specialties.items.fulfillment': void
    'home.specialties.items.compliance': void
    'home.specialties.items.analytics': void
    'home.platform.title': void
    'home.platform.cta': void
    'home.footer.description': void
    'home.footer.platform': void
    'home.footer.connect': void
    'details.eyebrow': void
    'details.back': void
    'details.download': void
    'details.empty.title': void
    'details.empty.description': void
    'details.empty.back': void
    'details.insights.0': void
    'details.insights.1': void
    'details.insights.2': void
    'details.sidebar.title': void
    'details.sidebar.points.platform': void
    'details.sidebar.points.fulfillment': void
    'details.sidebar.points.compliance': void
    'admin.nav.brand': void
    'admin.nav.dashboard': void
    'admin.nav.users': void
    'admin.nav.materials': void
    'admin.nav.materialCategories': void
    'admin.nav.inquiries': void
    'admin.nav.sensitiveWords': void
    'admin.nav.personalCenter': void
    'admin.nav.settings': void
    'admin.nav.signOut': void
    'admin.nav.adminUser': void
    'admin.nav.search': void
    'admin.pages.dashboard.title': void
    'admin.pages.dashboard.description': void
    'admin.pages.users.title': void
    'admin.pages.users.description': void
    'admin.pages.materials.title': void
    'admin.pages.materials.description': void
    'admin.pages.materialCategories.title': void
    'admin.pages.materialCategories.description': void
    'admin.pages.inquiries.title': void
    'admin.pages.inquiries.description': void
    'admin.pages.sensitiveWords.title': void
    'admin.pages.sensitiveWords.description': void
    'admin.pages.settings.title': void
    'admin.pages.settings.description': void
    'admin.crud.actions': void
    'admin.crud.noResults': void
    'admin.crud.rowsPerPage': void
    'admin.crud.pageSummary': { start: string | number | boolean | Date | null | undefined, end: string | number | boolean | Date | null | undefined, total: string | number | boolean | Date | null | undefined }
    'admin.crud.previous': void
    'admin.crud.next': void
    'admin.crud.selectAll': void
    'admin.crud.selectRow': void
    'admin.crud.deleteSelected': void
    'admin.crud.filters': void
    'admin.crud.openFilters': void
    'admin.crud.closeFilters': void
    'admin.crud.refresh': void
    'admin.crud.export': void
    'admin.crud.cancel': void
    'admin.crud.create': void
    'admin.crud.save': void
    'admin.status.draft': void
    'admin.status.published': void
    'admin.status.archived': void
    'admin.status.active': void
    'admin.status.disabled': void
    'admin.topbar.pin': void
    'admin.topbar.unpin': void
    'admin.topbar.remove': void
    'admin.login.title': void
    'admin.login.description': { siteName: string | number | boolean | Date | null | undefined }
    'admin.login.email': void
    'admin.login.password': void
    'admin.login.passwordPlaceholder': void
    'admin.login.showPassword': void
    'admin.login.hidePassword': void
    'admin.login.rememberEmail': void
    'admin.login.submit': void
    'admin.dashboard.metrics.totalInquiries': void
    'admin.dashboard.metrics.totalInquiriesDescription': void
    'admin.dashboard.metrics.newInquiries': void
    'admin.dashboard.metrics.newInquiriesDescription': void
    'admin.dashboard.metrics.publishedMaterials': void
    'admin.dashboard.metrics.publishedMaterialsDescription': { total: string | number | boolean | Date | null | undefined }
    'admin.dashboard.metrics.sensitiveHits': void
    'admin.dashboard.metrics.sensitiveHitsDescription': void
    'admin.dashboard.metrics.activeCategories': void
    'admin.dashboard.metrics.activeCategoriesDescription': void
    'admin.dashboard.metrics.activeSensitiveWords': void
    'admin.dashboard.metrics.activeSensitiveWordsDescription': void
    'admin.dashboard.metrics.activeUsers': void
    'admin.dashboard.metrics.activeUsersDescription': void
    'admin.dashboard.metrics.archivedMaterials': void
    'admin.dashboard.metrics.archivedMaterialsDescription': void
    'admin.dashboard.charts.inquiryTrend': void
    'admin.dashboard.charts.inquiryTrendDescription': void
    'admin.dashboard.charts.inquiries': void
    'admin.dashboard.charts.sensitiveHits': void
    'admin.dashboard.charts.countryDistribution': void
    'admin.dashboard.charts.countryDistributionDescription': void
    'admin.dashboard.charts.materialStatus': void
    'admin.dashboard.charts.materialStatusDescription': void
    'admin.dashboard.charts.sensitiveSeverity': void
    'admin.dashboard.charts.sensitiveSeverityDescription': void
    'admin.dashboard.recent.title': void
    'admin.dashboard.recent.description': void
    'admin.dashboard.recent.unknownLocation': void
    'admin.dashboard.empty.countries': void
    'admin.dashboard.empty.inquiries': void
    'admin.formErrors.required': { field: string | number | boolean | Date | null | undefined }
    'admin.formErrors.tooSmall': { field: string | number | boolean | Date | null | undefined, min: string | number | boolean | Date | null | undefined }
    'admin.formErrors.tooBig': { field: string | number | boolean | Date | null | undefined, max: string | number | boolean | Date | null | undefined }
    'admin.formErrors.invalidEmail': void
    'admin.formErrors.invalidUrl': { field: string | number | boolean | Date | null | undefined }
    'admin.formErrors.unknown': void
    'admin.formErrors.fields.form': void
    'admin.materials.actions.create': void
    'admin.materials.columns.title': void
    'admin.materials.columns.summary': void
    'admin.materials.columns.category': void
    'admin.materials.columns.content': void
    'admin.materials.columns.file': void
    'admin.materials.columns.size': void
    'admin.materials.columns.status': void
    'admin.materials.columns.createdAt': void
    'admin.materials.categories.marketplace': void
    'admin.materials.categories.logistics': void
    'admin.materials.categories.compliance': void
    'admin.materials.categories.playbook': void
    'admin.materials.form.createTitle': void
    'admin.materials.form.editTitle': void
    'admin.materials.form.title': void
    'admin.materials.form.summary': void
    'admin.materials.form.category': void
    'admin.materials.form.content': void
    'admin.materials.form.cover': void
    'admin.materials.form.attachment': void
    'admin.materials.form.noFile': void
    'admin.materials.form.status': void
    'admin.materials.form.uploadCover': void
    'admin.materials.form.uploadFile': void
    'admin.materials.form.uploaded': void
    'admin.materials.form.insertAsset': void
    'admin.materials.form.markdownImages': void
    'admin.materials.form.markdownVideos': void
    'admin.materials.form.markdownFiles': void
    'admin.materials.editor.createPageTitle': void
    'admin.materials.editor.createPageDescription': void
    'admin.materials.editor.editPageTitle': void
    'admin.materials.editor.editPageDescription': void
    'admin.materials.editor.backToList': void
    'admin.materials.editor.loading': void
    'admin.materials.editor.loadFailed': void
    'admin.materials.editor.created': void
    'admin.materials.editor.updated': void
    'admin.materials.editor.basicInfo': void
    'admin.materials.editor.basicInfoDescription': void
    'admin.materials.editor.markdownContent': void
    'admin.materials.editor.markdownContentDescription': void
    'admin.materials.editor.assets': void
    'admin.materials.editor.assetsDescription': void
    'admin.materials.editor.publishChecklist': void
    'admin.materials.editor.checkTitle': void
    'admin.materials.editor.checkCategory': void
    'admin.materials.editor.checkContent': void
    'admin.materials.validation.title': void
    'admin.materials.validation.summary': void
    'admin.materials.validation.content': void
    'admin.users.columns.username': void
    'admin.users.columns.nickname': void
    'admin.users.columns.email': void
    'admin.users.columns.status': void
    'admin.users.columns.createdAt': void
    'admin.users.stats.total': void
    'admin.users.stats.totalSubtext': void
    'admin.users.stats.active': void
    'admin.users.stats.activeSubtext': { percent: string | number | boolean | Date | null | undefined }
    'admin.users.stats.disabled': void
    'admin.users.stats.disabledSubtext': void
    'admin.users.stats.newThisMonth': void
    'admin.users.stats.newThisMonthSubtext': void
    'admin.settings.tabs.ariaLabel': void
    'admin.settings.tabs.profile': void
    'admin.settings.tabs.security': void
    'admin.settings.tabs.notifications': void
    'admin.settings.actions.saved': void
    'admin.settings.actions.updated': void
    'admin.settings.actions.saveChanges': void
    'admin.settings.actions.updatePassword': void
    'admin.settings.actions.revoke': void
    'admin.settings.profile.avatarAlt': void
    'admin.settings.profile.changePhoto': void
    'admin.settings.profile.removePhoto': void
    'admin.settings.profile.personalInformation': void
    'admin.settings.profile.firstName': void
    'admin.settings.profile.firstNamePlaceholder': void
    'admin.settings.profile.lastName': void
    'admin.settings.profile.lastNamePlaceholder': void
    'admin.settings.profile.emailAddress': void
    'admin.settings.profile.emailDescription': void
    'admin.settings.profile.bio': void
    'admin.settings.profile.bioPlaceholder': void
    'admin.settings.security.changePassword': void
    'admin.settings.security.currentPassword': void
    'admin.settings.security.currentPasswordPlaceholder': void
    'admin.settings.security.newPassword': void
    'admin.settings.security.newPasswordPlaceholder': void
    'admin.settings.security.confirmPassword': void
    'admin.settings.security.confirmPasswordPlaceholder': void
    'admin.settings.security.toggleVisibility': void
    'admin.settings.security.twoFactor': void
    'admin.settings.security.twoFactorEnabled': void
    'admin.settings.security.twoFactorDisabled': void
    'admin.settings.security.setupTwoFactor': void
    'admin.settings.security.confirmEnable': void
    'admin.settings.security.twoFactorQrTitle': void
    'admin.settings.security.scanTitle': void
    'admin.settings.security.scanDescription': void
    'admin.settings.security.manualKey': void
    'admin.settings.security.otpLabel': void
    'admin.settings.security.activeSessions': void
    'admin.settings.security.current': void
    'admin.settings.security.sessions.mac': void
    'admin.settings.security.sessions.iphone': void
    'admin.settings.security.sessions.windows': void
    'admin.settings.security.strength.tooWeak': void
    'admin.settings.security.strength.weak': void
    'admin.settings.security.strength.fair': void
    'admin.settings.security.strength.good': void
    'admin.settings.security.strength.strong': void
    'admin.settings.notifications.emailNotifications': void
    'admin.settings.notifications.emailDescription': void
    'admin.settings.notifications.pushNotifications': void
    'admin.settings.notifications.pushDescription': void
    'admin.settings.notifications.loginAlerts': void
    'admin.settings.notifications.loginAlertsDescription': void
    'admin.settings.notifications.securityUpdates': void
    'admin.settings.notifications.securityUpdatesDescription': void
    'admin.settings.notifications.productUpdates': void
    'admin.settings.notifications.productUpdatesDescription': void
    'admin.settings.notifications.realtimeAlerts': void
    'admin.settings.notifications.realtimeAlertsDescription': void
    'admin.settings.notifications.weeklyDigest': void
    'admin.settings.notifications.weeklyDigestDescription': void
    'admin.materialCategories.actions.create': void
    'admin.materialCategories.columns.name': void
    'admin.materialCategories.columns.slug': void
    'admin.materialCategories.columns.description': void
    'admin.materialCategories.columns.status': void
    'admin.materialCategories.columns.createdAt': void
    'admin.materialCategories.form.createTitle': void
    'admin.materialCategories.form.editTitle': void
    'admin.materialCategories.form.name': void
    'admin.materialCategories.form.slug': void
    'admin.materialCategories.form.description': void
    'admin.materialCategories.form.status': void
    'admin.materialCategories.validation.name': void
    'admin.materialCategories.validation.slug': void
    'admin.inquiries.columns.contact': void
    'admin.inquiries.columns.company': void
    'admin.inquiries.columns.email': void
    'admin.inquiries.columns.phone': void
    'admin.inquiries.columns.location': void
    'admin.inquiries.columns.description': void
    'admin.inquiries.columns.sensitive': void
    'admin.inquiries.columns.status': void
    'admin.inquiries.columns.createdAt': void
    'admin.inquiries.geo.ip': void
    'admin.inquiries.geo.countryCode': void
    'admin.inquiries.geo.region': void
    'admin.inquiries.geo.country': void
    'admin.inquiries.geo.city': void
    'admin.inquiries.geo.emoji': void
    'admin.inquiries.sensitive.hit': void
    'admin.inquiries.sensitive.clean': void
    'admin.sensitiveWords.actions.create': void
    'admin.sensitiveWords.columns.word': void
    'admin.sensitiveWords.columns.severity': void
    'admin.sensitiveWords.columns.status': void
    'admin.sensitiveWords.columns.note': void
    'admin.sensitiveWords.columns.createdAt': void
    'admin.sensitiveWords.severity.low': void
    'admin.sensitiveWords.severity.medium': void
    'admin.sensitiveWords.severity.high': void
    'admin.sensitiveWords.form.createTitle': void
    'admin.sensitiveWords.form.editTitle': void
    'admin.sensitiveWords.form.word': void
    'admin.sensitiveWords.form.severity': void
    'admin.sensitiveWords.form.status': void
    'admin.sensitiveWords.form.note': void
    'admin.sensitiveWords.validation.word': void
    'contact.back': void
    'contact.title': void
    'contact.description': void
    'contact.placeholders.contactName': void
    'contact.placeholders.companyName': void
    'contact.errors.required': { field: string | number | boolean | Date | null | undefined }
    'contact.errors.tooSmall': { field: string | number | boolean | Date | null | undefined, min: string | number | boolean | Date | null | undefined }
    'contact.errors.tooBig': { field: string | number | boolean | Date | null | undefined, max: string | number | boolean | Date | null | undefined }
    'contact.errors.invalidEmail': void
    'contact.errors.invalidUrl': { field: string | number | boolean | Date | null | undefined }
    'contact.errors.sensitiveContent': void
    'contact.errors.unknown': void
    'contact.errors.fields.form': void
    'contact.errors.fields.contactName': void
    'contact.errors.fields.companyName': void
    'contact.errors.fields.email': void
    'contact.errors.fields.phone': void
    'contact.errors.fields.description': void
    'member.pages.settings.title': void
    'member.pages.settings.description': void
    'member.settings.tabs.ariaLabel': void
    'member.settings.tabs.profile': void
    'member.settings.tabs.security': void
    'member.settings.tabs.billing': void
    'member.settings.tabs.privacy': void
    'member.settings.actions.save': void
    'member.settings.actions.update': void
    'member.settings.actions.cancel': void
    'member.settings.profile.title': void
    'member.settings.profile.description': void
    'member.settings.profile.username': void
    'member.settings.profile.usernameDescription': void
    'member.settings.profile.usernamePlaceholder': void
    'member.settings.profile.personalProfile': void
    'member.settings.profile.personalProfileDescription': void
    'member.settings.profile.personalProfileAria': void
    'member.settings.profile.personalProfilePlaceholder': void
    'member.settings.profile.timezone': void
    'member.settings.profile.timezoneDescription': void
    'member.settings.profile.searchTimezone': void
    'member.settings.profile.loadingTimezones': void
    'member.settings.profile.noResults': void
    'member.settings.profile.noTimezones': void
    'member.settings.profile.loadingMore': void
    'member.settings.billing.paymentMethod': void
    'member.settings.security.password': void
    'member.settings.security.passwordDescription': void
    'member.settings.security.passwordPlaceholder': void
    'member.settings.privacy.dataExport': void
    'member.settings.privacy.dataExportDescription': void
    'member.settings.privacy.dataExportBody': void
    'member.settings.privacy.exportMeta': void
    'member.settings.privacy.exporting': void
    'member.settings.privacy.exportData': void
    'member.settings.privacy.cookiePreferences': void
    'member.settings.privacy.cookieDescription': void
    'member.settings.privacy.necessaryCookies': void
    'member.settings.privacy.necessaryCookiesDescription': void
    'member.settings.privacy.functionalCookies': void
    'member.settings.privacy.functionalCookiesDescription': void
    'member.settings.privacy.analyticsCookies': void
    'member.settings.privacy.analyticsCookiesDescription': void
    'member.settings.privacy.marketingCookies': void
    'member.settings.privacy.marketingCookiesDescription': void
    'member.settings.privacy.savePreferences': void
    'member.settings.privacy.deleteAccount': void
    'member.settings.privacy.deleteDescription': void
    'member.settings.privacy.deleteBody': void
    'member.settings.privacy.deletePointData': void
    'member.settings.privacy.deletePointAccess': void
    'member.settings.privacy.deletePointUndo': void
    'member.settings.privacy.deleteConfirm': void
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
