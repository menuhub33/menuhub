import { requireConsole } from "@/core/auth/authorization";
import { isPlatformAdmin } from "@/core/auth/permissions";
import { ErrorState } from "@/core/components/common/error-state";
import { getMyMall } from "@/modules/malls/actions/malls";
import { MallProfileView } from "@/modules/malls/views/mall-profile-view";
import { forbidden } from "next/navigation";

export default async function MyMallPage() {
  const session = await requireConsole("/admin/mall");
  if (isPlatformAdmin(session.profile.platform_role) && !session.profile.mall) {
    forbidden();
  }
  const mall = await getMyMall();
  if (mall.error || !mall.data) return <ErrorState description={mall.error ?? "تعذر تحميل المول"} />;
  return <MallProfileView mall={mall.data} />;
}
