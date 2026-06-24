import { useEffect, useState } from 'react';
import Game from './Game';

interface Version {
  build: string;
  commit: string;
  timestamp: string;
}

const App = () => {
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
    <div className="app-container">
      <Game />

      <div style={{ marginTop: "1rem", opacity: 0.6, fontSize: "0.8rem" }}>
        {error ? (
          <span>{error}</span>
        ) : version ? (
          <span>
            Build {version.build} • {version.commit.slice(0, 7)}
          </span>
        ) : (
          <span>Loading build info...</span>
        )}
      </div>
    </div>
  );
};

export default App;
