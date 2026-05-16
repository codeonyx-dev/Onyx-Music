import React from 'react';
import { FONDO } from '../constants/assets';

function AppBackground() {
  return (
    <div className="absolute inset-0 pointer-events-none" aria-hidden>
      <div
        className="absolute inset-0 bg-cover bg-center opacity-70"
        style={{ backgroundImage: `url(${FONDO})` }}
      />
      <div className="absolute inset-0 bg-black/30" />
    </div>
  );
}

export default AppBackground;
