import DashboardOverview from "@/components/dashboard/DashboardOverview";
import { getDashboardData } from "@/lib/dashboard/queries";

export default async function DashboardPage() {
  return <DashboardOverview {...await getDashboardData()} />;
}
