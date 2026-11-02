import { requireConsole } from "@/core/auth/authorization";
import { isPlatformAdmin } from "@/core/auth/permissions";
import { ErrorState } from "@/core/components/common/error-state";
import { getMyMall, getMyMallTheme } from "@/modules/malls/actions/malls";
import { MallDesignView } from "@/modules/malls/views/mall-design-view";
import { forbidden } from "next/navigation";

export default async function MyMallDesignPage() {
  const session = await requireConsole("/admin/mall/design");
  if (isPlatformAdmin(session.profile.platform_role) && !session.profile.mall) forbidden();

  const [mall, theme] = await Promise.all([getMyMall(), getMyMallTheme()]);
  if (mall.error || !mall.data) return <ErrorState description={mall.error ?? "تعذر تحميل المول"} />;
  if (theme.error) return <ErrorState description={theme.error} />;

  return <MallDesignView mall={mall.data} theme={theme.data} scope="mine" />;
}
