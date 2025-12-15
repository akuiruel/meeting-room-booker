import { Link, useLocation } from 'react-router-dom';
import { Calendar, Home, LogIn, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const Header = () => {
  const location = useLocation();

  const navItems = [
    { href: '/', label: 'Beranda', icon: Home },
    { href: '/schedule', label: 'Jadwal', icon: Calendar },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Calendar className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg hidden sm:inline">RuangBook</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link key={item.href} to={item.href}>
                <Button
                  variant={location.pathname === item.href ? 'secondary' : 'ghost'}
                  className={cn(
                    'gap-2',
                    location.pathname === item.href && 'bg-primary/10 text-primary'
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Button>
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/admin">
            <Button variant="outline" className="gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Admin</span>
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
};
