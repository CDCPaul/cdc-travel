import Navigation from './Navigation';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navigation />
      <div style={{ paddingTop: '56px' }}>
        {children}
      </div>
    </>
  );
} 