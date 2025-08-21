import React from 'react';

import logo from '../logo.svg';

interface LogoProps {
  height?: number | string;
}

const Logo: React.FC<LogoProps> = ({ height = 40 }) => (
  <img src={logo} alt="Music Studio logo" style={{ height }} />
);

export default Logo;

