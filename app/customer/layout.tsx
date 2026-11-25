
import BottomNavigation from "@/components/customer/BottomNavigation";

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <main className="pb-28">
        {children}
      </main>

      <BottomNavigation />
    </div>
  );
}
