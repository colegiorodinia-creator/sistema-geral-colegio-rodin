import React from 'react';
import logoFullColor from '../assets/logo/logo-full-color-transparent.png';
import logoFullWhite from '../assets/logo/logo-full-white-transparent.png';
import logoFullBlack from '../assets/logo/logo-full-black-transparent.png';
import thinkerMarkBlack from '../assets/logo/thinker-mark-black-transparent.png';
import thinkerMarkWhite from '../assets/logo/thinker-mark-white-transparent.png';
import thinkerMarkOrange from '../assets/logo/thinker-mark-orange.png';

/**
 * Componente Oficial da Identidade Visual do Colégio Rodin
 *
 * @param {'color' | 'white' | 'black' | 'icon-black' | 'icon-white' | 'icon-orange'} variant
 * @param {string} className
 * @param {string} alt
 * @param {number} height
 */
export default function RodinLogo({
  variant = 'color',
  className = 'h-10 w-auto object-contain',
  alt = 'Colégio Rodin',
  style = {}
}) {
  let src = logoFullColor;

  if (variant === 'white') src = logoFullWhite;
  else if (variant === 'black') src = logoFullBlack;
  else if (variant === 'icon-black') src = thinkerMarkBlack;
  else if (variant === 'icon-white') src = thinkerMarkWhite;
  else if (variant === 'icon-orange') src = thinkerMarkOrange;

  return (
    <img
      src={src}
      alt={alt}
      className={`select-none ${className}`}
      style={style}
    />
  );
}
