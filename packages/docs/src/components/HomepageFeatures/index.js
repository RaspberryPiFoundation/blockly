import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

const FeatureList = [
  {
    title: 'Accessible by design',
    Svg: require('@site/static/images/HomePage/Accessibility-tier-4.svg')
      .default,
    description: (
      <>
        Built so everyone can engage with visual code — helping developers
        create experiences that are inclusive by default.
      </>
    ),
  },
  {
    title: 'Built for flexibility',
    Svg: require('@site/static/images/HomePage/Explore-tier-4.svg').default,
    description: (
      <>
        An open-source library that adapts to your needs. With APIs, generators,
        and integrations, Blockly fits into most platforms, and environments.
      </>
    ),
  },
  {
    title: 'Driven by community',
    Svg: require('@site/static/images/HomePage/Connect-tier-4.svg').default,
    description: (
      <>
        A global community of passionate developers and educators helps Blockly
        stay open, innovative, and ready for what’s next.
      </>
    ),
  },
];

function Feature({ Svg, title, description }) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h2">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
