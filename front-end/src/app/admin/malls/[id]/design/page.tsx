import { requirePlatformAdmin } from "@/core/auth/authorization";
import { ErrorState } from "@/core/components/common/error-state";
import { getAdminMall, getAdminMallTheme } from "@/modules/malls/actions/malls";
import { MallDesignView } from "@/modules/malls/views/mall-design-view";

export default async function AdminMallDesignPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePlatformAdmin("/admin/malls");
  const { id } = await params;
  const [mall, theme] = await Promise.all([getAdminMall(id), getAdminMallTheme(id)]);
  if (mall.error || !mall.data) return <ErrorState description={mall.error ?? "تعذر تحميل المول"} />;
  if (theme.error) return <ErrorState description={theme.error} />;

  return <MallDesignView mall={mall.data} theme={theme.data} scope="admin" />;
}
