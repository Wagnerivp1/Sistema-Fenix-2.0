import { StatsCards } from '@/components/dashboard/stats-cards';
import { RevenueChart } from '@/components/dashboard/revenue-chart';
import { RecentOrdersTable } from '@/components/dashboard/recent-orders-table';

export default function DashboardPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 md:gap-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCards />
      </div>
      <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <RevenueChart />
        </div>
        <RecentOrdersTable />
      </div>
    </div>
  );
}
