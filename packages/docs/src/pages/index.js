import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import useBaseUrl from '@docusaurus/useBaseUrl';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';

import Heading from '@theme/Heading';
import styles from './index.module.css';

function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext();
  const homePageGif = useBaseUrl('/images/HomePage/home-animation.gif');

  return (
    <header className={clsx(styles.heroBanner)}>
      <div className={clsx('container', styles.heroContainer)}>
        <div className={styles.heroContent}>
          <div className={styles.heroText}>
            <div className={styles.developerDocsLabel}>Developer docs</div>
            <Heading as="h1" className={styles.heroTitle}>
              Build with Blockly
            </Heading>
            <p className={styles.heroDescription}>
              An open-source, flexible library for developers to build visual
              programming editors with drag-and-drop blocks - powering the
              world’s most popular block-based coding platforms.
            </p>
            <div className={styles.buttons}>
              <Link
                className={clsx(styles.button, 'getStarted')}
                to="/guides/get-started/what-is-blockly">
                Get started
              </Link>
            </div>
          </div>
          <div className={styles.heroVisual}>
            <img
              src={homePageGif}
              alt="Blockly code block example"
              className={styles.blocklyGif}
            />
          </div>
        </div>
      </div>
    </header>
  );
}

export default function Home() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout
      title={`${siteConfig.title}`}
      description="A JavaScript library for building visual programming editors.">
      <HomepageHeader />
      <main>
        <HomepageFeatures />
      </main>
    </Layout>
  );
}
