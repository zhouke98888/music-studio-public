import React from 'react';

const logo = process.env.PUBLIC_URL + '/logo.png';

interface LogoProps {
  height?: number | string;
}

const Logo: React.FC<LogoProps> = ({ height = 40 }) => (
  <img src={logo} alt="Music Studio logo" style={{ height }} />
);

export default Logo;

