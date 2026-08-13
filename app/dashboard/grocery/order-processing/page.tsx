import CustomerOrderTracking from "@/components/grocery/CustomerOrderTracking";
import { getCustomerLocalStoreOrderStatus } from "@/lib/local-store/queries";

type OrderProcessingPageProps = { searchParams: Promise<{ order?: string }> };

export default async function OrderProcessingPage({ searchParams }: OrderProcessingPageProps) {
  const { order: orderId } = await searchParams;
  return <CustomerOrderTracking initialOrder={await getCustomerLocalStoreOrderStatus(orderId ?? "")} />;
}
