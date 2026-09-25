import React from 'react';
import { Camera, Users, Clock, Globe } from 'lucide-react';

export default function FeaturesBar({ t }) {
  const features = [
    {
      icon: Camera,
      title: t('feat_1_title'),
      description: t('feat_1_desc'),
    },
    {
      icon: Users,
      title: t('feat_2_title'),
      description: t('feat_2_desc'),
    },
    {
      icon: Clock,
      title: t('feat_3_title'),
      description: t('feat_3_desc'),
    },
    {
      icon: Globe,
      title: t('feat_4_title'),
      description: t('feat_4_desc'),
    },
  ];

  return (
    <section id="features" className="lenso-features-bar">
      <div className="container features-grid">
        {features.map((feat, index) => {
          const Icon = feat.icon;
          return (
            <div key={index} className="feature-item">
              <div className="feature-icon-wrapper">
                <Icon size={28} strokeWidth={1.5} className="feature-icon" />
              </div>
              <div className="feature-text">
                <h4 className="feature-title">{feat.title}</h4>
                <p className="feature-desc">{feat.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
