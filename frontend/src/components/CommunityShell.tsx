import CommunitySideNav from '@/components/CommunitySideNav';

export default function CommunityShell({
  children,
  active,
  right,
}: {
  children: React.ReactNode;
  active?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="wrap">
      <div className={`layout ${right ? '' : 'no-right'}`}>
        <CommunitySideNav active={active} />
        <main className="main">{children}</main>
        {right && <aside className="right">{right}</aside>}
      </div>
    </div>
  );
}
