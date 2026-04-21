/**
 * Root theme component - wraps the entire app
 * Handles client-side tracking
 */

import React, { useEffect } from 'react';
import {
  trackSiteSearch,
  trackCTAClick,
  trackCopyCode,
  extractFunctionName,
} from '../../utils/tracking';

export default function Root({ children }) {
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (!window.dataLayer) {
      window.dataLayer = [];
    }

    let lastTrackedQuery = '';
    let searchTimeout = null;

    const handleDocSearchQuery = (event) => {
      if (event.detail && event.detail.query) {
        const query = event.detail.query.trim();
        if (query && query !== lastTrackedQuery && query.length > 0) {
          trackSiteSearch(query);
          lastTrackedQuery = query;
        }
      }
    };

    document.addEventListener('docsearch:query', handleDocSearchQuery);

    const setupInputTracking = (searchInput) => {
      if (searchInput.hasAttribute('data-tracking-setup')) {
        return;
      }

      searchInput.setAttribute('data-tracking-setup', 'true');

      const handleInput = (e) => {
        const query = e.target.value.trim();

        if (searchTimeout) {
          clearTimeout(searchTimeout);
        }

        if (query.length > 0 && query !== lastTrackedQuery) {
          searchTimeout = setTimeout(() => {
            trackSiteSearch(query);
            lastTrackedQuery = query;
          }, 800);
        }
      };

      const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
          const query = e.target.value.trim();
          if (query && query !== lastTrackedQuery && query.length > 0) {
            if (searchTimeout) {
              clearTimeout(searchTimeout);
            }
            trackSiteSearch(query);
            lastTrackedQuery = query;
          }
        }
      };

      searchInput.addEventListener('input', handleInput);
      searchInput.addEventListener('keydown', handleKeyDown);
    };

    const observer = new MutationObserver(() => {
      const searchInput = document.querySelector('.DocSearch-Input');
      if (searchInput) {
        setupInputTracking(searchInput);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    const initialSearchInput = document.querySelector('.DocSearch-Input');
    if (initialSearchInput) {
      setupInputTracking(initialSearchInput);
    }

    const handleResultClick = (e) => {
      const hitElement = e.target.closest('.DocSearch-Hit');
      if (hitElement) {
        const searchInput = document.querySelector('.DocSearch-Input');
        if (searchInput && searchInput.value) {
          const query = searchInput.value.trim();
          if (query && query !== lastTrackedQuery && query.length > 0) {
            trackSiteSearch(query);
            lastTrackedQuery = query;
          }
        }
      }
    };

    document.addEventListener('click', handleResultClick);

    // CTA Click Tracking
    // Track clicks on buttons and links that should be treated as CTAs
    const handleCTAClick = (e) => {
      // Find the clicked element (could be button, link, or child element)
      let target = e.target;

      // Traverse up to find the actual button/link element
      while (target && target !== document.body) {
        // Check if it's a button or link with CTA classes
        const ctaSelector =
          'a.getStarted, a.button, button.button, .button, a.cardButton, .cardButton, .downloadAsset, a.downloadAsset, .assetDownloadLink, a.assetDownloadLink';
        const isCTA =
          target.matches &&
          (target.matches(ctaSelector) || target.closest(ctaSelector));

        if (isCTA) {
          const ctaElement = target.matches(ctaSelector)
            ? target
            : target.closest(ctaSelector);

          if (ctaElement) {
            let clickUrl = '';
            if (ctaElement.href) {
              clickUrl = ctaElement.href;
            } else if (ctaElement.getAttribute('href')) {
              const href = ctaElement.getAttribute('href');
              clickUrl = href.startsWith('http')
                ? href
                : window.location.origin + href;
            } else if (ctaElement.getAttribute('to')) {
              // Docusaurus Link component uses 'to' attribute
              const to = ctaElement.getAttribute('to');
              clickUrl = to.startsWith('http')
                ? to
                : window.location.origin + to;
            } else {
              clickUrl = window.location.href;
            }

            // Get the text content
            let clickText =
              ctaElement.textContent?.trim() ||
              ctaElement.innerText?.trim() ||
              ctaElement.getAttribute('aria-label') ||
              ctaElement.getAttribute('title') ||
              'CTA Click';

            // Clean up the text (remove extra whitespace)
            clickText = clickText.replace(/\s+/g, ' ').trim();

            // Track the CTA click
            if (clickUrl && clickText) {
              trackCTAClick(clickUrl, clickText);
            }
          }
          break;
        }
        target = target.parentElement;
      }
    };

    document.addEventListener('click', handleCTAClick);

    // Code Copy Tracking
    const handleCodeCopyClick = (e) => {
      // Find the copy button (Docusaurus uses a button with aria-label containing "copy")
      const copyButton = e.target.closest(
        'button[aria-label*="copy" i], button[aria-label*="copier" i]',
      );

      if (copyButton) {
        const codeBlock = copyButton.closest(
          'div[class*="codeBlock"], .theme-code-block, .prism-code, pre',
        );

        if (codeBlock) {
          let codeElement = codeBlock.querySelector('code');

          if (!codeElement) {
            const preElement =
              codeBlock.querySelector('pre code') ||
              codeBlock.closest('pre')?.querySelector('code');
            if (preElement) {
              codeElement = preElement;
            }
          }

          if (codeElement) {
            // Extract language from class names (recursive search)
            const findLanguage = (element) => {
              if (!element || element === document.body) return 'unknown';

              const classList = Array.from(element.classList);
              const langClass = classList.find((cls) =>
                cls.startsWith('language-'),
              );

              if (langClass) {
                return langClass.replace('language-', '');
              }

              return findLanguage(element.parentElement);
            };

            // Also check pre element and container for language class
            let languageName = findLanguage(codeElement);
            if (languageName === 'unknown') {
              const preElement = codeElement.closest('pre');
              if (preElement) {
                languageName = findLanguage(preElement);
              }
            }
            if (languageName === 'unknown') {
              languageName = findLanguage(codeBlock);
            }

            const codeContent =
              codeElement.textContent || codeElement.innerText || '';

            const functionName = extractFunctionName(codeContent, languageName);

            trackCopyCode(functionName, languageName);
          }
        }
      }
    };

    // Also listen for copy events to catch any copy operations
    const handleCopyEvent = (e) => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;

      const range = selection.getRangeAt(0);
      let node = range.commonAncestorContainer;

      if (node.nodeType === Node.TEXT_NODE) {
        node = node.parentElement;
      }

      const codeElement = node?.closest?.('code');
      if (!codeElement) return;

      // Extract language
      const findLanguage = (element) => {
        const classList = Array.from(element.classList);
        const langClass = classList.find((cls) => cls.startsWith('language-'));
        console.log('hello', langClass);

        if (langClass) return langClass.replace('language-', '');

        const parent = element.parentElement;
        if (parent && parent !== document.body) {
          return findLanguage(parent);
        }
        return 'unknown';
      };

      const languageName = findLanguage(codeElement);
      const codeContent = selection.toString() || codeElement.textContent || '';
      const functionName = extractFunctionName(codeContent, languageName);

      trackCopyCode(functionName, languageName);
    };

    document.addEventListener('click', handleCodeCopyClick);
    document.addEventListener('copy', handleCopyEvent);

    // Cleanup
    return () => {
      document.removeEventListener('docsearch:query', handleDocSearchQuery);
      document.removeEventListener('click', handleResultClick);
      document.removeEventListener('click', handleCTAClick);
      document.removeEventListener('click', handleCodeCopyClick);
      document.removeEventListener('copy', handleCopyEvent);
      observer.disconnect();
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, []);

  return <>{children}</>;
}
