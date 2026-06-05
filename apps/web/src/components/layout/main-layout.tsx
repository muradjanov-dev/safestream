import { Navbar } from './navbar';
import { Sidebar } from './sidebar';

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex pt-16">
        <Sidebar />
        <main className="flex-1 ml-0 md:ml-64 min-h-[calc(100vh-4rem)]">{children}</main>
      </div>
    </div>
  );
}
