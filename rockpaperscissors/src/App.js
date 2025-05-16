// App.js
import React, { useState } from 'react';
import Game from './game.js';
import PlayerCard from './playerCard.js' 
import ErrorBoundary from './errorboundary.js';

function App() {
  const [playerInfo, setPlayerInfo] = useState(null);

  return (
    <div className="App">
      <h1>🎮 Rock Paper Scissors with Voice</h1>
      <ErrorBoundary>
        {!playerInfo ? (
          <PlayerCard onSubmit={setPlayerInfo} />
        ) : (
          <Game playerInfo={playerInfo} />
        )}
      </ErrorBoundary>
    </div>
  );
}

export default App;
