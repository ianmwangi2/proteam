import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Phone, CheckCircle, X, ChevronRight, Shield, Camera, Fingerprint, Zap, Flame, Lock, Wifi, ParkingSquare, ScanLine, Truck, AlertTriangle } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import usePageTitle from '../hooks/usePageTitle';
import { services as rawServices } from '../data/services';
import './Services.css';

// Map icon strings to lucide components for use in cards
const iconMap = { Camera, Fingerprint, Zap, AlertTriangle, Flame, ScanLine, Lock, Shield, Wifi, ParkingSquare, Truck };
const services = rawServices.map((s) => ({ ...s, icon: iconMap[s.icon] || Shield }));



const processSteps = [
  { step: '01', title: 'Site Survey', desc: 'Our engineers visit your premises to assess security needs and recommend the right solutions.' },
  { step: '02', title: 'Proposal', desc: 'We provide a detailed proposal with itemized scope and a clear project timeline.' },
  { step: '03', title: 'Installation', desc: 'Certified technicians deploy and configure all equipment to specification.' },
  { step: '04', title: 'Handover', desc: 'Full system demonstration, staff training, and an ongoing support agreement.' },
];

export default function Services() {
  const navigate = useNavigate();
  const [selectedService, setSelectedService] = useState(null);
  usePageTitle('Services');

  const openService = (service) => {
    setSelectedService(service);
    document.body.style.overflow = 'hidden';
  };

  const closeService = () => {
    setSelectedService(null);
    document.body.style.overflow = '';
  };

  return (
    <div className="page-wrapper">
      <Navbar />

      {/* Hero */}
      <div className="services-hero">
        <div className="container">
          <p className="text-label" style={{ color: 'var(--color-green-primary)', marginBottom: 8 }}>What We Do</p>
          <h1 className="services-hero-title">Our Services</h1>
          <p className="services-hero-desc">
            Comprehensive security and IT solutions — from CCTV and access control to fire alarms, networking and parking systems. Click any service to explore in detail.
          </p>
          <div style={{ display: 'flex', gap: 16, marginTop: 24, flexWrap: 'wrap' }}>
            <button className="btn btn-primary btn-lg" onClick={() => navigate('/contact')} id="services-survey-btn">
              Book a Free Survey <ArrowRight size={18} />
            </button>
            <button className="btn btn-ghost btn-lg" onClick={() => navigate('/contact')} id="services-call-btn">
              <Phone size={16} /> Call Us Now
            </button>
          </div>
        </div>
      </div>

      {/* Services Grid */}
      <section className="section">
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-3xl)' }}>
            <p className="text-label" style={{ color: 'var(--color-green-primary)', marginBottom: 8 }}>Click to Explore</p>
            <h2 className="section-title">All Services</h2>
            <p style={{ color: 'var(--color-text-secondary)', maxWidth: 560, margin: '12px auto 0' }}>
              Select a service card to view detailed product offerings, features, and specifications.
            </p>
          </div>
          <div className="services-grid-new">
            {services.map((service) => {
              const Icon = service.icon;
              return (
                <button
                  key={service.id}
                  className="service-card-new card"
                  onClick={() => navigate(`/services/${service.id}`)}
                  id={`service-card-${service.id}`}
                  aria-label={`View ${service.title} details`}
                >
                  <div className="service-card-img-wrap">
                    <img src={service.image} alt={service.title} className="service-card-img" loading="lazy" />
                    <div className="service-card-img-overlay" style={{ background: `linear-gradient(to bottom, transparent 40%, ${service.color}22 100%)` }} />
                    <span className="service-card-tag text-label">{service.tag}</span>
                  </div>
                  <div className="service-card-body">
                    <div className="service-card-icon-wrap" style={{ background: `${service.color}18`, border: `1px solid ${service.color}30` }}>
                      <Icon size={22} color={service.color} />
                    </div>
                    <h3 className="service-card-title-new">{service.title}</h3>
                    <p className="service-card-desc">{service.shortDesc}</p>
                    <span className="service-card-cta">
                      View Details <ChevronRight size={15} />
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="section" style={{ background: 'var(--color-bg-secondary)', borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-3xl)' }}>
            <p className="text-label" style={{ color: 'var(--color-green-primary)', marginBottom: 8 }}>How We Work</p>
            <h2 className="section-title">Our Simple Process</h2>
          </div>
          <div className="process-grid">
            {processSteps.map((step, i) => (
              <div key={step.step} className="process-card card card-padded">
                <div className="process-step-num">{step.step}</div>
                <h3 className="process-title">{step.title}</h3>
                <p className="process-desc">{step.desc}</p>
                {i < processSteps.length - 1 && <div className="process-connector" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section">
        <div className="container">
          <div className="services-cta">
            <Shield size={48} color="#34c76e" />
            <h2 className="services-cta-title">Ready to Get Started?</h2>
            <p className="services-cta-desc">Book your free site survey today. Our engineers will assess your premises and prepare a tailored security proposal at no cost.</p>
            <button className="btn btn-primary btn-lg" onClick={() => navigate('/contact')} id="services-book-btn">
              Book Free Site Survey <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </section>

      <Footer />

      {/* Service Detail Modal */}
      {selectedService && (
        <div className="service-modal-overlay" onClick={closeService} role="dialog" aria-modal="true" aria-label={selectedService.title}>
          <div className="service-modal" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header Image */}
            <div className="service-modal-hero">
              <img src={selectedService.image} alt={selectedService.title} className="service-modal-img" />
              <div className="service-modal-hero-overlay" />
              <div className="service-modal-hero-content">
                <span className="text-label" style={{ color: 'var(--color-green-primary)' }}>{selectedService.tag}</span>
                <h2 className="service-modal-title">{selectedService.title}</h2>
              </div>
              <button className="service-modal-close btn-icon" onClick={closeService} id="service-modal-close" aria-label="Close">
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="service-modal-body">
              {/* Description */}
              <div className="service-modal-section">
                <h3 className="service-modal-section-title">About This Service</h3>
                {selectedService.fullDesc.split('\n\n').map((para, i) => (
                  <p key={i} className="service-modal-desc">{para}</p>
                ))}
              </div>

              {/* Features */}
              <div className="service-modal-section">
                <h3 className="service-modal-section-title">What's Included</h3>
                <div className="service-modal-features">
                  {selectedService.features.map((feat) => (
                    <div key={feat} className="service-modal-feature-item">
                      <CheckCircle size={16} color="#34c76e" style={{ flexShrink: 0, marginTop: 2 }} />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Products */}
              <div className="service-modal-section">
                <h3 className="service-modal-section-title">Products & Equipment</h3>
                <div className="service-modal-products">
                  {selectedService.products.map((product) => (
                    <div key={product.name} className="service-modal-product card card-padded">
                      <span className="service-modal-product-emoji">{product.emoji}</span>
                      <div>
                        <h4 className="service-modal-product-name">{product.name}</h4>
                        <p className="service-modal-product-desc">{product.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <div className="service-modal-footer">
                <button
                  className="btn btn-primary btn-lg"
                  onClick={() => { closeService(); navigate('/contact'); }}
                  id={`modal-quote-${selectedService.id}`}
                >
                  Get a Quote for This Service <ArrowRight size={18} />
                </button>
                <button className="btn btn-ghost btn-lg" onClick={closeService}>
                  ← Back to Services
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
