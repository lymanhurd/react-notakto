import Game from './Game'
import version from "./version.json";

export default function App() {
  return (
    <div className="app-container">
      <Game />

      <div style={{ marginTop: "1rem", opacity: 0.6, fontSize: "0.8rem" }}>
        Build {version.build} • {version.commit.slice(0, 7)}
      </div>
    </div>
  )
}
