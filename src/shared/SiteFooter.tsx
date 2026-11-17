import VersionInfo from './VersionInfo';

/** Footer shared by every page: Hurd-Sullivan logo and build info. */
const SiteFooter = () => (
  <footer className="site-footer">
    <a href="http://www.hurd-sullivan.com/">
      <img src="/images/HS.gif" alt="Go to Hurd-Sullivan.com" />
    </a>
    <VersionInfo />
  </footer>
);

export default SiteFooter;
