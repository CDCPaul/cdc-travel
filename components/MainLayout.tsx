import Navigation from './Navigation';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navigation />
      <div style={{ paddingTop: 'var(--navbar-height, 50px)' }}>
        {children}
      </div>
    </>
  );
} 