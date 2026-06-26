// lib/i18n.ts — compact bilingual dictionary (vi default / en).
import type { ArticleStatus, Language } from '@/types';
import type { BadgeTone } from '@/components/ui/Badge';
import { useLanguage } from '@/lib/store';

const vi = {
  appName: 'GoMax SEO Studio',
  tagline: 'Từ từ khóa đến bài chuẩn SEO đã đăng — trong 3 thao tác.',
  nav: {
    dashboard: 'Tổng quan',
    campaigns: 'Chiến dịch',
    brandVoice: 'Văn thương hiệu',
    settings: 'Cài đặt',
  },
  actions: {
    newArticle: 'Bài viết mới',
    newCampaign: 'Chiến dịch mới',
    generate: 'Tạo bài',
    generateAll: 'Tạo tất cả',
    skipGenerate: 'Bỏ qua & tạo luôn',
    publish: 'Đăng bài',
    schedule: 'Lên lịch',
    save: 'Lưu',
    saved: 'Đã lưu',
    cancel: 'Hủy',
    delete: 'Xóa',
    edit: 'Chỉnh sửa',
    open: 'Mở',
    retry: 'Thử lại',
    loadDemo: 'Nạp dữ liệu mẫu',
    analyze: 'Phân tích',
    back: 'Quay lại',
    accept: 'Chấp nhận',
    reject: 'Bỏ qua',
  },
  common: {
    keyword: 'Từ khóa',
    title: 'Tiêu đề',
    meta: 'Mô tả meta',
    slug: 'Đường dẫn (slug)',
    words: 'từ',
    minRead: 'phút đọc',
    demoData: 'Dữ liệu mẫu',
    sandbox: 'Sandbox',
    connected: 'Đã kết nối',
    notConnected: 'Chưa kết nối',
    loading: 'Đang tải…',
    language: 'Ngôn ngữ',
    none: 'Không có',
    optional: 'tùy chọn',
  },
  status: {
    draft: 'Nháp',
    optimizing: 'Đang tối ưu',
    ready: 'Sẵn sàng',
    scheduled: 'Đã lên lịch',
    published: 'Đã đăng',
    failed: 'Lỗi',
  } as Record<ArticleStatus, string>,
};

const en: typeof vi = {
  appName: 'GoMax SEO Studio',
  tagline: 'From a keyword to a published SEO article — in 3 actions.',
  nav: {
    dashboard: 'Overview',
    campaigns: 'Campaigns',
    brandVoice: 'Brand voice',
    settings: 'Settings',
  },
  actions: {
    newArticle: 'New article',
    newCampaign: 'New campaign',
    generate: 'Generate',
    generateAll: 'Generate all',
    skipGenerate: 'Skip & generate',
    publish: 'Publish',
    schedule: 'Schedule',
    save: 'Save',
    saved: 'Saved',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    open: 'Open',
    retry: 'Retry',
    loadDemo: 'Load demo data',
    analyze: 'Analyze',
    back: 'Back',
    accept: 'Accept',
    reject: 'Dismiss',
  },
  common: {
    keyword: 'Keyword',
    title: 'Title',
    meta: 'Meta description',
    slug: 'Slug',
    words: 'words',
    minRead: 'min read',
    demoData: 'Demo data',
    sandbox: 'Sandbox',
    connected: 'Connected',
    notConnected: 'Not connected',
    loading: 'Loading…',
    language: 'Language',
    none: 'None',
    optional: 'optional',
  },
  status: {
    draft: 'Draft',
    optimizing: 'Optimizing',
    ready: 'Ready',
    scheduled: 'Scheduled',
    published: 'Published',
    failed: 'Failed',
  },
};

export type Dict = typeof vi;

const dicts: Record<Language, Dict> = { vi, en };

export function getDict(lang: Language): Dict {
  return dicts[lang] ?? vi;
}

export function useT(): Dict {
  return getDict(useLanguage());
}

export const STATUS_TONE: Record<ArticleStatus, BadgeTone> = {
  draft: 'neutral',
  optimizing: 'info',
  ready: 'accent',
  scheduled: 'info',
  published: 'success',
  failed: 'danger',
};
