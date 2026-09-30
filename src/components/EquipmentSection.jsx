import React from 'react';
import { Aperture, CheckCircle2 } from 'lucide-react';
import { getGoogleDriveImageUrl } from '../lib/imageUrl';

export default function EquipmentSection({ equipment = [], t }) {
  if (!equipment || equipment.length === 0) return null;

  return (
    <section id="equipment" className="lenso-equipment-section">
      <div className="container">
        <div className="equipment-header text-center">

          <h2 className="section-title text-white">{t('high_end_equipment')}</h2>
        </div>

        <div className="equipment-cards-grid">
          {equipment.map((item) => (
            <div key={item.id} className="equipment-card">
              <div className="equipment-image-container">
                <img
                  src={getGoogleDriveImageUrl(item.image_url || 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80')}
                  alt={item.name}
                  loading="lazy"
                />
                <div className="equipment-badge">
                  <Aperture size={14} />
                  <span>{t('pro_spec')}</span>
                </div>
              </div>

              <div className="equipment-details">
                <h3 className="equipment-name">{item.name}</h3>
                {item.model && <p className="equipment-model">{item.model}</p>}
                
                <div className="equipment-features-list">
                  <div className="gear-tag">
                    <CheckCircle2 size={13} className="text-gold" />
                    <span>{t('calibrated_color')}</span>
                  </div>
                  <div className="gear-tag">
                    <CheckCircle2 size={13} className="text-gold" />
                    <span>{t('dynamic_range')}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
