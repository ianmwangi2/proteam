import { useState } from 'react';
import { useParams, useNavigate, NavLink } from 'react-router-dom';
import { ArrowRight, CheckCircle, ChevronRight, Phone, ArrowLeft, X, MessageSquare } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import QuoteRequestModal from '../components/QuoteRequestModal';
import usePageTitle from '../hooks/usePageTitle';
import { getServiceById } from '../data/services';
import './ServiceDetail.css';

function ProductModal({ product, serviceColor, onClose, onQuote }) {
  return (
    <div className="prod-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="prod-modal" onClick={e => e.stopPropagation()}>
        <button className="prod-modal-close btn-icon" onClick={onClose} aria-label="Close">
          <X size={20} />
        </button>
        <div className="prod-modal-img-wrap">
          <img src={product.image || product.serviceImage} alt={product.name} className="prod-modal-img" />
          <div className="prod-modal-img-overlay" />
        </div>
        <div className="prod-modal-body">
          <p className="text-label" style={{ color: serviceColor, marginBottom: 6 }}>Equipment Detail</p>
          <h2 className="prod-modal-title">{product.name}</h2>
          <p className="prod-modal-desc">{product.desc}</p>
          {product.specs && (
            <div className="prod-modal-specs">
              <p className="prod-modal-specs-title">Key Specifications</p>
              <ul className="prod-modal-specs-list">
                {product.specs.map(s => (
                  <li key={s} className="prod-modal-spec-item">
                    <CheckCircle size={14} color={serviceColor} style={{ flexShrink: 0 }} />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="prod-modal-actions">
            <button className="btn btn-primary btn-lg" onClick={onQuote} id={`prod-quote-${product.name}`}>
              <MessageSquare size={16} /> Request a Quote
            </button>
            <button className="btn btn-ghost" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ServiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const service = getServiceById(id);
  const [activeProduct, setActiveProduct] = useState(null);
  const [quoteOpen, setQuoteOpen] = useState(false);
  usePageTitle(service ? service.title : 'Service');

  const openQuoteModal = () => {
    setActiveProduct(null); // close product modal if open
    setQuoteOpen(true);
  };

  if (!service) {
    return (
      <div className="page-wrapper">
        <Navbar />
        <div className="not-found-wrap container">
          <h1>Service not found</h1>
          <button className="btn btn-primary" onClick={() => navigate('/services')}>← Back to Services</button>
        </div>
        <Footer />
      </div>
    );
  }

  const handleQuote = () => {
    setActiveProduct(null);
    setQuoteOpen(true);
  };

  return (
    <div className="page-wrapper">
      <Navbar />

      {/* HERO */}
      <section className="sd-hero" style={{ '--accent': service.color }}>
        <div className="sd-hero-img-wrap">
          <img src={service.image} alt={service.title} className="sd-hero-img" />
          <div className="sd-hero-overlay" />
        </div>
        <div className="container sd-hero-content">
          <nav className="sd-breadcrumb" aria-label="Breadcrumb">
            <NavLink to="/" className="sd-breadcrumb-link">Home</NavLink>
            <ChevronRight size={14} />
            <NavLink to="/services" className="sd-breadcrumb-link">Services</NavLink>
            <ChevronRight size={14} />
            <span className="sd-breadcrumb-current">{service.title}</span>
          </nav>
          <p className="text-label" style={{ color: service.color, marginBottom: 10 }}>{service.tag}</p>
          <h1 className="sd-hero-title">{service.title}</h1>
          <p className="sd-hero-sub">{service.shortDesc}</p>
          <div className="sd-hero-actions">
            <button className="btn btn-primary btn-lg" onClick={openQuoteModal} id="sd-quote-btn">
              Get a Free Quote <ArrowRight size={18} />
            </button>
            <button className="btn btn-ghost btn-lg" onClick={() => navigate('/services')} id="sd-back-btn">
              <ArrowLeft size={16} /> All Services
            </button>
          </div>
        </div>
      </section>

      {/* OVERVIEW */}
      <section className="section sd-overview">
        <div className="container sd-overview-inner">
          <div className="sd-overview-text">
            <p className="text-label" style={{ color: service.color, marginBottom: 8 }}>Overview</p>
            <h2 className="sd-section-title">About This Service</h2>
            {service.fullDesc.split('\n\n').map((para, i) => (
              <p key={i} className="sd-para">{para}</p>
            ))}
            {service.components && (
              <div className="sd-components-block">
                <p className="sd-components-title">{service.componentsTitle}</p>
                <ul className="sd-components-list">
                  {service.components.map(c => (
                    <li key={c} className="sd-components-item">
                      <CheckCircle size={15} color={service.color} style={{ flexShrink: 0 }} />
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <div className="sd-overview-img-col">
            {service.galleryImages.map((img, i) => (
              <div key={i} className="sd-gallery-item">
                <img src={img.src} alt={img.caption} className="sd-gallery-img" loading="lazy" />
                <p className="sd-gallery-caption">{img.caption}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="section sd-process" style={{ background: 'var(--color-bg-secondary)', borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)' }}>
        <div className="container">
          <div className="sd-section-header">
            <p className="text-label" style={{ color: service.color, marginBottom: 8 }}>Process</p>
            <h2 className="sd-section-title">How It Works</h2>
          </div>
          <div className="sd-process-grid">
            {service.howItWorks.map((step, i) => (
              <div key={step.step} className="sd-process-card card card-padded">
                <div className="sd-process-num" style={{ color: service.color }}>{step.step}</div>
                <h3 className="sd-process-title">{step.title}</h3>
                <p className="sd-process-desc">{step.desc}</p>
                {i < service.howItWorks.length - 1 && (
                  <div className="sd-process-arrow" style={{ color: service.color }}>
                    <ChevronRight size={20} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="section">
        <div className="container sd-features-wrap">
          <div className="sd-features-left">
            <p className="text-label" style={{ color: service.color, marginBottom: 8 }}>What's Included</p>
            <h2 className="sd-section-title">Service Features</h2>
            <p className="sd-para" style={{ marginBottom: 0 }}>
              Every {service.title} installation includes a full suite of professional services — from initial assessment through to commissioning and ongoing support.
            </p>
            <button className="btn btn-primary btn-lg" onClick={openQuoteModal} style={{ marginTop: 28 }} id="sd-features-quote-btn">
              Book a Free Survey <ArrowRight size={18} />
            </button>
          </div>
          <div className="sd-features-grid">
            {service.features.map(feat => (
              <div key={feat} className="sd-feature-item">
                <CheckCircle size={18} color={service.color} style={{ flexShrink: 0, marginTop: 2 }} />
                <span>{feat}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRODUCTS — clickable image cards */}
      <section className="section sd-products-section" style={{ background: 'var(--color-bg-secondary)', borderTop: '1px solid var(--color-border)' }}>
        <div className="container">
          <div className="sd-section-header">
            <p className="text-label" style={{ color: service.color, marginBottom: 8 }}>Equipment</p>
            <h2 className="sd-section-title">Products &amp; Equipment</h2>
            <p className="sd-products-subtitle">Click any product to view full specifications and request a quote.</p>
          </div>
          <div className="sd-products-grid">
            {service.products.map(product => (
              <button
                key={product.name}
                className="sd-product-card card"
                onClick={() => setActiveProduct({ ...product, serviceImage: service.image })}
                id={`product-${product.name.replace(/\s+/g, '-').toLowerCase()}`}
              >
                <div className="sd-product-img-wrap">
                  <img
                    src={product.image || service.image}
                    alt={product.name}
                    className="sd-product-img"
                    loading="lazy"
                  />
                  <div className="sd-product-img-overlay" style={{ background: `linear-gradient(to top, ${service.color}33 0%, transparent 60%)` }} />
                  <div className="sd-product-view-hint">
                    <span>View Details</span>
                    <ChevronRight size={14} />
                  </div>
                </div>
                <div className="sd-product-body">
                  <h4 className="sd-product-name">{product.name}</h4>
                  <p className="sd-product-desc">{product.desc}</p>
                  <span className="sd-product-cta" style={{ color: service.color }}>
                    Get a Quote <ArrowRight size={13} />
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section sd-cta-section">
        <div className="container sd-cta-inner">
          <div>
            <h2 className="sd-cta-title">Ready to Get Started?</h2>
            <p className="sd-cta-desc">Contact us today for a free site survey and tailored proposal for your {service.title.toLowerCase()} needs.</p>
          </div>
          <div className="sd-cta-actions">
            <button className="btn btn-primary btn-lg" onClick={openQuoteModal} id="sd-cta-quote-btn">
              Get a Free Quote <ArrowRight size={18} />
            </button>
            <a href="tel:+254725300350" className="btn btn-ghost btn-lg" id="sd-cta-call-btn">
              <Phone size={16} /> Call Us Now
            </a>
          </div>
        </div>
      </section>

      <Footer />

      {/* Product Detail Modal */}
      {activeProduct && (
        <ProductModal
          product={activeProduct}
          serviceColor={service.color}
          onClose={() => setActiveProduct(null)}
          onQuote={handleQuote}
        />
      )}

      {/* Quote Request Modal */}
      {quoteOpen && (
        <QuoteRequestModal
          prefilledService={service}
          onClose={() => setQuoteOpen(false)}
        />
      )}
    </div>
  );
}
