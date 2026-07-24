import React from 'react';
import vimesLogoSrc from '../../assets/vimes_logo_tight_transparent.png';

interface VimesLogoProps {
  className?: string;
  /** Height in px of the rendered logo area. Default: 72 */
  height?: number;
}

/**
 * VimesLogo — renders the official ViMES brand logo (vimes_logo_tight_transparent.png).
 * Source image size: 762 x 209 px.
 * We scale the image to exactly fit the desired height and display the full width.
 */
export const VimesLogo: React.FC<VimesLogoProps> = ({
  className = '',
  height = 72,
}) => {
  // Source image natural aspect ratio: 762 / 209 ≈ 3.645
  const NATURAL_W = 762;
  const NATURAL_H = 209;
  const aspectRatio = NATURAL_W / NATURAL_H;
  const displayW = Math.round(height * aspectRatio);

  return (
    <img
      src={vimesLogoSrc}
      alt="ViMES - Công ty Cổ phần Phần mềm Y tế Việt Nam"
      width={displayW}
      height={height}
      className={`select-none flex-shrink-0 ${className}`}
      style={{
        width: displayW,
        height: height,
        objectFit: 'fill',
        imageRendering: 'auto',
      }}
      draggable={false}
    />
  );
};

export default VimesLogo;
