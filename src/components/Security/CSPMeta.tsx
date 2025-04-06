import type React from 'react';
import { useEffect } from 'react';

import { getCSPMetaContent } from '../../utils/csp';

/**
 * Component that adds a Content Security Policy meta tag to the document head
 */
export const CSPMeta: React.FC = () => {
  useEffect(() => {
    // Check if CSP meta tag already exists
    let cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');

    if (!cspMeta) {
      // Create CSP meta tag if it doesn't exist
      cspMeta = document.createElement('meta');
      cspMeta.setAttribute('http-equiv', 'Content-Security-Policy');
      document.head.appendChild(cspMeta);
    }

    // Set CSP content
    cspMeta.setAttribute('content', getCSPMetaContent());

    return () => {
      // Remove CSP meta tag when component unmounts
      cspMeta?.remove();
    };
  }, []);

  // This component doesn't render anything
  return null;
};

export default CSPMeta;
