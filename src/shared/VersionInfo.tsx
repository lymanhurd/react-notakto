import { useEffect, useState } from 'react';

interface Version {
  build: string;
  commit: string;
  timestamp: string;
}

/** Small footer line showing the build number and commit from /version.json. */
const VersionInfo = () => {
  const [version, setVersion] = useState<Version | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/version.json')
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => setVersion(data))
      .catch(err => {
        console.error('Failed to load version:', err);
        setError('Version info unavailable');
      });
  }, []);

  return (
    <span className="version-info">
      {error
        ? error
        : version
          ? `Build ${version.build} • ${version.commit.slice(0, 7)}`
          : 'Loading build info…'}
    </span>
  );
};

export default VersionInfo;
