import React from 'react';
import { Link } from 'react-router-dom';
import Logo from './Logo';
import { Mail, Phone, Facebook, Linkedin } from 'lucide-react';

const WhatsAppIcon = ({ size = 18 }: { size?: number }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
  </svg>
);

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#fcfcfc] border-t border-black/5 pt-24 pb-12 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-24">
        <div className="col-span-1 md:col-span-1">
          <Link to="/" className="mb-6 block">
            <Logo />
          </Link>
          <p className="text-black/50 text-sm leading-relaxed max-w-xs">
            Helping startups rise in their graphic design journey. Stop designing, start growing.
          </p>
          <div className="flex items-center gap-4 mt-8">
            <a 
              href="https://www.facebook.com/p/Prk-Graphicz-100075493674529/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="p-2 bg-brand-primary/5 text-brand-primary rounded-full hover:bg-brand-primary/10 transition-colors"
              title="Facebook"
            >
              <Facebook size={18} />
            </a>
            <a 
              href="https://sr.linkedin.com/in/prk-graphicz-graphic-designer" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="p-2 bg-brand-primary/5 text-brand-primary rounded-full hover:bg-brand-primary/10 transition-colors"
              title="LinkedIn"
            >
              <Linkedin size={18} />
            </a>
            <a 
              href="https://wa.me/5977174880" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="p-2 bg-brand-primary/5 text-brand-primary rounded-full hover:bg-brand-primary/10 transition-colors"
              title="WhatsApp"
            >
              <WhatsAppIcon size={18} />
            </a>
          </div>
        </div>

        <div>
          <h4 className="font-bold text-sm uppercase tracking-widest mb-6 text-black/40">Company</h4>
          <ul className="flex flex-col gap-4">
            <li><Link to="/about" className="text-sm font-medium hover:text-black/60 transition-colors">About Us</Link></li>
            <li><Link to="/services" className="text-sm font-medium hover:text-black/60 transition-colors">Services</Link></li>
            <li><Link to="/pricing" className="text-sm font-medium hover:text-black/60 transition-colors">Pricing</Link></li>
            <li><Link to="/contact" className="text-sm font-medium hover:text-black/60 transition-colors">Contact</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold text-sm uppercase tracking-widest mb-6 text-black/40">Legal</h4>
          <ul className="flex flex-col gap-4">
            <li><a href="#" className="text-sm font-medium hover:text-black/60 transition-colors">Privacy Policy</a></li>
            <li><a href="#" className="text-sm font-medium hover:text-black/60 transition-colors">Terms of Service</a></li>
            <li><a href="#" className="text-sm font-medium hover:text-black/60 transition-colors">Cookie Policy</a></li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold text-sm uppercase tracking-widest mb-6 text-black/40">Contact</h4>
          <ul className="flex flex-col gap-4">
            <li className="flex items-center gap-3 text-sm font-medium">
              <Mail size={16} className="text-black/40" />
              prkgraphicz@gmail.com
            </li>
            <li className="flex items-center gap-3 text-sm font-medium">
              <Phone size={16} className="text-black/40" />
              (597) 7174880
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-12 border-t border-black/5 flex flex-col md:flex-row items-center justify-between gap-6">
        <p className="text-xs text-black/40 font-medium">
          © {currentYear} PRK GRAPHICZ. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
