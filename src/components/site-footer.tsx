export function SiteFooter() {
  return (
    <footer className="mt-auto sals-dark">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-8 sm:grid-cols-3">
          <div>
            <p className="text-xl font-bold text-[#C20E0E]" style={{ fontFamily: "'Brush Script MT', 'Segoe Script', cursive" }}>
              Sal&apos;s Italian Restaurant &amp; Pizzeria
            </p>
            <p className="mt-2 text-sm text-white/70">Serving Radford the finest Italian food since 1978.</p>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-white/90">Visit Us</h3>
            <p className="mt-2 text-sm text-white/70">
              709 West Main Street
              <br />
              Radford, Virginia 24141
            </p>
            <a href="tel:+15406399669" className="mt-2 block text-sm font-medium text-white hover:underline">
              (540) 639-9669
            </a>
            <a href="mailto:Joe@salsradford.com" className="block text-sm text-white/70 hover:underline">
              Joe@salsradford.com
            </a>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-white/90">Hours</h3>
            <ul className="mt-2 space-y-1 text-sm text-white/70">
              <li>Mon, Wed &amp; Thu: 10:30 am – 8:30 pm</li>
              <li>Tuesday: Closed</li>
              <li>Fri &amp; Sat: 10:30 am – 9:00 pm</li>
              <li>Sunday: 11:30 am – 8:30 pm</li>
            </ul>
          </div>
        </div>
        <div className="mt-8 flex flex-col items-center gap-2 border-t border-white/15 pt-6 text-sm text-white/60">
          <p>© {new Date().getFullYear()} Sal&apos;s Italian Restaurant &amp; Pizzeria</p>
        </div>
      </div>
    </footer>
  )
}
