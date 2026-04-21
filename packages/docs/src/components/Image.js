import React from 'react';
import { useColorMode } from '@docusaurus/theme-common';
import useBaseUrl from '@docusaurus/useBaseUrl';

/**
 * Image component for use in MDX docs
 * Wraps HTML img tag with additional styling and responsiveness
 * Supports theme-based image loading (light/dark mode)
 *
 * @param {string} src - Image source path (for light mode)
 * @param {string} srcDark - Optional image source path for dark mode
 * @param {string} alt - Alt text for accessibility
 * @param {number|string} width - Optional width (in pixels)
 * @param {number|string} height - Optional height (in pixels)
 * @param {string} className - Optional CSS class for custom styling
 * @param {object} style - Optional inline styles
 */
export default function Image({
  src,
  srcDark,
  alt,
  width,
  height,
  className,
  style = {},
  ...props
}) {
  const { colorMode } = useColorMode();

  // Select image source based on current theme
  const imageSrc = colorMode === 'dark' && srcDark ? srcDark : src;

  // Prepend baseUrl to the image path
  const resolvedSrc = useBaseUrl(imageSrc);

  const imgStyle = {
    maxWidth: '100%',
    height: 'auto',
    ...style,
  };

  if (width) {
    imgStyle.width = typeof width === 'number' ? `${width}px` : width;
  }
  if (height) {
    imgStyle.height = typeof height === 'number' ? `${height}px` : height;
  }

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      className={className}
      style={{ ...imgStyle }}
      {...props}
    />
  );
}
