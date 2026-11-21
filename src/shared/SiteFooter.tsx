import VersionInfo from './VersionInfo';
import { CONTACT_EMAIL, STORE_URL, contactClickAttrs, storeClickAttrs } from './links';

/** "nim", "silver", … from the current path, for tagging analytics events. */
function pageName(): string {
  return window.location.pathname.split('/').filter(Boolean)[0] ?? 'home';
}

/**
 * Footer shared by every page: a note pointing teachers to the worksheet store,
 * the Lyman's Logic Games badge, About/Contact links and build info. The front
 * page has its own, larger store panel, so it passes showStore={false}.
 */
const SiteFooter = ({ showStore = true }: { showStore?: boolean }) => (
  <>
    {showStore && (
      <aside className="store-note" aria-label="Classroom worksheets">
        <p>
          <strong>Teaching with this game?</strong> Classroom worksheets and strategy packets are available in
          the Lyman's Logic Games store on <em>Teachers Pay Teachers</em>.
        </p>
        <a className="store-note-link" href={STORE_URL} target="_blank" rel="noopener"
          {...storeClickAttrs(`game-page:${pageName()}`)}>
          Visit the store <span aria-hidden="true">↗</span>
          <span className="visually-hidden"> (opens Teachers Pay Teachers in a new tab)</span>
        </a>
      </aside>
    )}
    <footer className="site-footer">
      <a className="footer-brand" href="/">
        <img src="/images/logo-badge-small.webp" alt="" width="48" height="48" />
        <span>Lyman's Logic Games</span>
      </a>
      <nav className="footer-links" aria-label="Site">
        <a href="/#games">Games</a>
        <a href="/#about">About</a>
        <a href={`mailto:${CONTACT_EMAIL}`} {...contactClickAttrs(`footer:${pageName()}`)}>Contact</a>
      </nav>
      <VersionInfo />
    </footer>
  </>
);

export default SiteFooter;
