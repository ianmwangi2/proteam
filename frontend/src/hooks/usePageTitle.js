import { useEffect } from 'react';

const SITE = 'Pro.Team Technologies';
const DEFAULT_DESC = 'Professional security solutions — CCTV, access control, fire alarms, and biometric systems for homes and enterprises across East Africa.';
const OG_IMAGE = '/logo.png';

const PAGE_META = {
  Home:           'Professional security solutions — CCTV, access control, fire alarms, and biometric systems for homes and enterprises across East Africa.',
  Products:       'Browse professional-grade CCTV cameras, access control, biometric systems, fire alarms, and networking equipment.',
  Services:       'Expert security installation, maintenance, and consulting services for businesses and homes across Kenya.',
  About:          'Learn about Pro.Team Technologies — 14+ years delivering enterprise-grade security solutions across East Africa.',
  Contact:        'Get in touch with Pro.Team Technologies for a free security consultation and site survey.',
  Support:        'Submit a support ticket or check the status of existing requests with Pro.Team Technologies.',
  Cart:           'Review your shopping cart and proceed to checkout at Pro.Team Technologies.',
  Checkout:       'Complete your order — secure checkout for Pro.Team Technologies security equipment.',
  Account:        'Manage your Pro.Team Technologies account, orders, and preferences.',
};

function setMeta(attr, key, content) {
  let el = document.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

export default function usePageTitle(title) {
  useEffect(() => {
    const prev = document.title;
    const fullTitle = title ? `${title} | ${SITE}` : `${SITE} — Security Solutions`;
    const description = PAGE_META[title] || DEFAULT_DESC;

    document.title = fullTitle;
    setMeta('name', 'description', description);
    setMeta('property', 'og:title', fullTitle);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:type', 'website');
    setMeta('property', 'og:image', OG_IMAGE);
    setMeta('property', 'og:site_name', SITE);
    setMeta('name', 'twitter:card', 'summary');
    setMeta('name', 'twitter:title', fullTitle);
    setMeta('name', 'twitter:description', description);
    setMeta('name', 'twitter:image', OG_IMAGE);

    return () => { document.title = prev; };
  }, [title]);
}
