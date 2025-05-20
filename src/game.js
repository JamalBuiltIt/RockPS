import React, { useState, useEffect, useRef } from 'react';
import VoiceChat from './VoiceChat.js';
import { io } from 'socket.io-client';
import './game.css';

const socket = io('http://localhost:3001');
const moves = ['Rock', 'Paper', 'Scissors'];

export default function Game({ playerInfo }) {
  const [room, setRoom] = useState(null);
  const [opponent, setOpponent] = useState(null);
  const [myMove, setMyMove] = useState(null);
  const [opponentMove, setOpponentMove] = useState(null);
  const [result, setResult] = useState(null);
  const [waiting, setWaiting] = useState(false);
  const [showRematchModal, setShowRematchModal] = useState(false);

  const listenersAttached = useRef(false);

  useEffect(() => {
    if (!playerInfo) return;

    socket.emit('joinMatchmaking', {
      name: playerInfo.name,
      instagram: playerInfo.instagram,
    });

    const onMatchSuccess = ({ room, opponent }) => {
      console.log('✅ Match found, room:', room);
      setRoom(room);
      setOpponent(opponent);
    };

    socket.on('matchSuccess', onMatchSuccess);

    return () => {
      socket.off('matchSuccess', onMatchSuccess);
    };
  }, [playerInfo]);

  useEffect(() => {
    if (listenersAttached.current) return;

    socket.on('revealMoves', ({ yourMove, theirMove, result }) => {
      console.log('🧾 Moves revealed:', yourMove, theirMove, result);
      setMyMove(yourMove);
      setOpponentMove(theirMove);
      setResult(result);
      setWaiting(false);
    });

    socket.on('opponentDisconnected', () => {
      alert('❌ Opponent disconnected. Searching for new opponent...');
      resetGame();
      setRoom(null);
      setOpponent(null);
      socket.emit('joinMatchmaking', {
        name: playerInfo.name,
        instagram: playerInfo.instagram,
      });
    });

    socket.on('rematchRequested', () => setShowRematchModal(true));

    socket.on('startRematch', () => {
      console.log('🔁 Rematch starting');
      resetGame();
      setShowRematchModal(false);
    });

    socket.on('opponentSkipped', () => {
      alert('⚠️ Your opponent skipped you. Searching for a new match...');
      resetGame();
      setRoom(null);
      setOpponent(null);
      socket.emit('joinMatchmaking', {
        name: playerInfo.name,
        instagram: playerInfo.instagram,
      });
    });

    listenersAttached.current = true;
  }, [playerInfo]);

  const handleMove = (move) => {
    if (myMove || !socket || !room) return;
    setMyMove(move);
    setWaiting(true);
    socket.emit('submitMove', { move, room });
  };

  const requestRematch = () => {
    socket.emit('requestRematch', { room });
  };

  const acceptRematch = () => {
    socket.emit('acceptRematch', { room });
    setShowRematchModal(false);
  };

  const declineRematch = () => {
    setShowRematchModal(false);
  };

  const resetGame = () => {
    setMyMove(null);
    setOpponentMove(null);
    setResult(null);
    setWaiting(false);
  };

  const skipOpponent = () => {
    if (!room) return;
    socket.emit('opponentSkipped', { room });
    resetGame();
    setRoom(null);
    setOpponent(null);
    socket.emit('joinMatchmaking', {
      name: playerInfo.name,
      instagram: playerInfo.instagram,
    });
  };

  if (!room) return <div className="game-container"><h2>🔎 Looking for an opponent...</h2></div>;

  return (
    <div className="game-container">
      <h2>👤 You: {playerInfo.name}</h2>
      <h4>📸 Instagram: {playerInfo.instagram}</h4>
      <hr />
      <h3>🧑 Opponent: {opponent?.name || 'Unknown'}</h3>
      <h4>📸 Instagram: {opponent?.instagram || 'Not available'}</h4>

      {!myMove && !result && (
        <>
          <h2>🕹️ Pick your move:</h2>
          <div className="move-buttons">
            {moves.map((m) => (
              <button key={m} onClick={() => handleMove(m)} className="move-btn">{m}</button>
            ))}
          </div>
          <button onClick={skipOpponent} className="skip-btn">⏭️ Skip Opponent</button>
        </>
      )}

      {waiting && <><h2>Waiting for opponent...</h2><h3>You picked: {myMove}</h3></>}

      {result && (
        <>
          <h2>Your Move: {myMove}</h2>
          <h2>Opponent Move: {opponentMove}</h2>
          <h2>Result: {result}</h2>
          <button onClick={requestRematch} className="rematch-btn">🔁 Play Again</button>
        </>
      )}

      {showRematchModal && <RematchModal accept={acceptRematch} decline={declineRematch} />}
      <VoiceChat room={room} />
    </div>
  );
}

function RematchModal({ accept, decline }) {
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%',
      height: '100%', backgroundColor: 'rgba(0,0,0,0.6)',
      display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white', padding: '30px', borderRadius: '10px',
        textAlign: 'center', boxShadow: '0 0 20px rgba(0,0,0,0.3)'
      }}>
        <h2>Rematch Requested!</h2>
        <p>Your opponent wants to play again. Do you accept?</p>
        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-around' }}>
          <button onClick={accept} style={{
            backgroundColor: 'green', color: 'white',
            padding: '10px 20px', borderRadius: '5px', cursor: 'pointer'
          }}>✅ Accept</button>
          <button onClick={decline} style={{
            backgroundColor: 'red', color: 'white',
            padding: '10px 20px', borderRadius: '5px', cursor: 'pointer'
          }}>❌ Decline</button>
        </div>
      </div>
    </div>
  );
}
