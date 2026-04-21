import React from 'react';
import Link from '@docusaurus/Link';
import styles from './styles.module.css';

// This component renders the grid layout
export function CodelabGrid({ children }) {
  return <div className={styles.codelabGrid}>{children}</div>;
}

// This component renders a single card
export function CodelabCard({ href, title, description, children, level }) {
  return (
    <div className={styles.codelabCard}>
      <div className={styles.cardHeader}>
        <span className={styles.cardIcon}>{children}</span>
      </div>
      <div>
        <span className={styles.eyebrow}>{level}</span>
      </div>
      <div className={styles.cardFooter}>
        <h3 className={styles.cardTitle}>{title}</h3>
        <Link href={href}>
          <span className={styles.cardButton}>Start</span>
        </Link>
      </div>
    </div>
  );
}
