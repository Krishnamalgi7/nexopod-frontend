
import DashboardAuthGuard from "@/components/dashboard/DashboardAuthGuard";

export const instant = false;

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <DashboardAuthGuard>
            {children}
        </DashboardAuthGuard>
    );
}
