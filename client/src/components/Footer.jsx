const Footer = () => {
  return (
    <footer className="border-t border-white/10 bg-slate-950/70">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-sm text-slate-400 sm:px-6 lg:px-8 md:flex-row md:items-center md:justify-between">
        <p>© 2026 Thumblify. AI thumbnails for creators.</p>
        <div className="flex gap-5">
          <span>Fast prompts</span>
          <span>JWT Auth</span>
          <span>Community feed</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;