'use client';
import * as React from 'react';
import {
  FlaskConical,
  Plug,
  KeyRound,
  ShieldCheck,
  Trash2,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { useStudio, useHydrated, useLanguage } from '@/lib/store';
import { useT } from '@/lib/i18n';
import { api } from '@/lib/api';
import { toast } from '@/components/ui/Toast';
import { PageContainer, PageHeader } from '@/components/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Switch } from '@/components/ui/Switch';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';

export default function SettingsPage() {
  const hydrated = useHydrated();
  const t = useT();
  const isEn = useLanguage() === 'en';
  const wp = useStudio((s) => s.wp);
  const setWp = useStudio((s) => s.setWp);
  const loadDemo = useStudio((s) => s.loadDemo);
  const resetAll = useStudio((s) => s.resetAll);
  const [testing, setTesting] = React.useState(false);

  if (!hydrated) {
    return (
      <PageContainer>
        <Skeleton className="mb-6 h-9 w-48" />
        <Skeleton className="h-80" />
      </PageContainer>
    );
  }

  const onField = (patch: Partial<typeof wp>) => setWp({ ...patch, verified: false });

  const testConnection = async () => {
    if (!wp.siteUrl || !wp.username || !wp.appPassword) {
      toast.error(isEn ? 'Fill in all WordPress fields first.' : 'Hãy nhập đủ thông tin WordPress.');
      return;
    }
    setTesting(true);
    try {
      const { data } = await api.wpTest({
        siteUrl: wp.siteUrl,
        username: wp.username,
        appPassword: wp.appPassword,
      });
      if (data.ok) {
        setWp({ verified: true });
        toast.success((isEn ? 'Connected as ' : 'Đã kết nối: ') + (data.user?.name ?? wp.username));
      } else {
        setWp({ verified: false });
        toast.error(data.error || (isEn ? 'Connection failed' : 'Kết nối thất bại'));
      }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setTesting(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title={t.nav.settings}
        description={isEn ? 'Connect WordPress and manage sandbox mode.' : 'Kết nối WordPress và quản lý chế độ Sandbox.'}
      />

      <div className="flex flex-col gap-6">
        {/* Sandbox */}
        <Card>
          <CardContent className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-warning/10 text-warning">
                <FlaskConical className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-fg">{t.common.sandbox}</h3>
                  {wp.sandbox && <Badge tone="warning">{isEn ? 'On' : 'Bật'}</Badge>}
                </div>
                <p className="mt-1 max-w-md text-sm text-muted">
                  {isEn
                    ? 'When on, publishing is simulated — no real WordPress call is made. Perfect for demos without any setup.'
                    : 'Khi bật, thao tác đăng bài chỉ được mô phỏng — không gọi WordPress thật. Phù hợp để demo mà không cần cấu hình gì.'}
                </p>
              </div>
            </div>
            <Switch checked={wp.sandbox} onCheckedChange={(v) => setWp({ sandbox: v })} />
          </CardContent>
        </Card>

        {/* WordPress connection */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle>{isEn ? 'Connect WordPress' : 'Kết nối WordPress'}</CardTitle>
              {wp.verified ? (
                <Badge tone="success" dot>
                  {t.common.connected}
                </Badge>
              ) : (
                <Badge tone="neutral" dot>
                  {t.common.notConnected}
                </Badge>
              )}
            </div>
            <CardDescription>
              {isEn
                ? 'Uses an Application Password over the WordPress REST API. Credentials are stored server-side in the SQLite database.'
                : 'Dùng Application Password qua WordPress REST API. Thông tin được lưu trong cơ sở dữ liệu SQLite phía server.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div>
              <Label htmlFor="siteUrl">Site URL</Label>
              <Input
                id="siteUrl"
                placeholder="https://your-site.com"
                value={wp.siteUrl}
                onChange={(e) => onField({ siteUrl: e.target.value })}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  placeholder="admin"
                  value={wp.username}
                  onChange={(e) => onField({ username: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="apppw">Application Password</Label>
                <Input
                  id="apppw"
                  type="password"
                  placeholder="xxxx xxxx xxxx xxxx xxxx xxxx"
                  value={wp.appPassword}
                  onChange={(e) => onField({ appPassword: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-start gap-2 rounded-md border border-border bg-surface-hover/40 p-3 text-xs text-muted">
              <KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-faint" />
              <span>
                {isEn ? (
                  <>Create one in WordPress: <strong className="text-fg">Users → Profile → Application Passwords</strong>. Requires WordPress 5.6+ and HTTPS.</>
                ) : (
                  <>Tạo trong WordPress: <strong className="text-fg">Thành viên → Hồ sơ → Mật khẩu ứng dụng</strong>. Yêu cầu WordPress 5.6+ và HTTPS.</>
                )}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <Button onClick={testConnection} loading={testing} variant="secondary">
                <Plug className="h-4 w-4" />
                {isEn ? 'Test connection' : 'Kiểm tra kết nối'}
              </Button>
              {wp.verified && (
                <span className="flex items-center gap-1.5 text-sm text-success">
                  <CheckCircle2 className="h-4 w-4" />
                  {isEn ? 'Verified' : 'Đã xác minh'}
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Demo data / danger zone */}
        <Card>
          <CardHeader>
            <CardTitle>{isEn ? 'Demo data' : 'Dữ liệu mẫu'}</CardTitle>
            <CardDescription>
              {isEn
                ? 'Load a ready-made cross-linked campaign, or clear all local data.'
                : 'Nạp sẵn một campaign mẫu có internal link, hoặc xóa toàn bộ dữ liệu cục bộ.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={() => { loadDemo(); toast.success(isEn ? 'Demo data loaded' : 'Đã nạp dữ liệu mẫu'); }}>
              <Sparkles className="h-4 w-4" />
              {t.actions.loadDemo}
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (window.confirm(isEn ? 'Delete all local data?' : 'Xóa toàn bộ dữ liệu cục bộ?')) {
                  resetAll();
                  toast.success(isEn ? 'All data cleared' : 'Đã xóa toàn bộ dữ liệu');
                }
              }}
            >
              <Trash2 className="h-4 w-4" />
              {isEn ? 'Reset all data' : 'Xóa toàn bộ dữ liệu'}
            </Button>
          </CardContent>
        </Card>

        <p className="flex items-center justify-center gap-1.5 text-center text-2xs text-faint">
          <ShieldCheck className="h-3.5 w-3.5" />
          {isEn
            ? 'API keys live only on the server (env vars) and never reach the browser.'
            : 'API key chỉ nằm trên server (biến môi trường), không bao giờ lộ ra trình duyệt.'}
        </p>
      </div>
    </PageContainer>
  );
}
