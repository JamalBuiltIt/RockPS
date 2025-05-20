import React, { useState } from 'react';
import './playerCard.css';

export default function PlayerCard({ onSubmit }) {
  const [name, setName] = useState('');
  const [instagram, setInstagram] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim() && instagram.trim()) {
      onSubmit({ name, instagram });
    }
  };

  return (
    <div className="player-card">
      <h2>🎮 Enter Your Info</h2>
      <form onSubmit={handleSubmit}>
        <label>Name:</label>
        <input
          type="text"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <label>Instagram:</label>
        <input
          type="text"
          placeholder="@yourhandle"
          value={instagram}
          onChange={(e) => setInstagram(e.target.value)}
        />

        <button type="submit">Start Game</button>
      </form>
    </div>
  );
}
