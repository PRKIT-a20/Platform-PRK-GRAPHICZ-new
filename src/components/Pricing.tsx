import React from 'react';
import { Link } from 'react-router-dom';
import { Check, X } from 'lucide-react';
import { motion } from 'motion/react';

const plans = [
  {
    name: 'Starter',
    price: '300',
    description: 'Designed for startups and small businesses that need a professional brand foundation.',
    features: [
      'Professional Logo Design',
      'Basic Brand Guidelines',
      'Essential Marketing Materials',
      'Email Support'
    ],
    cta: 'Choose Plan',
    popular: false,
    isCustomPrice: false
  },
  {
    name: 'Business',
    price: '1,000',
    description: 'Designed for growing businesses that need a complete branding and marketing solution.',
    features: [
      'Comprehensive Brand Strategy',
      'Advanced Marketing Assets',
      'Social Media Templates',
      'Priority Phone Support'
    ],
    cta: 'Choose Plan',
    popular: true,
    isCustomPrice: false
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    description: 'Custom pricing for tailored solutions and enterprise scale.',
    features: [
      'Custom Business Solutions',
      'Dedicated Account Manager',
      'Full-Scale Digital Transformation',
      '24/7 Priority Support'
    ],
    cta: 'Schedule a Consultation',
    popular: false,
    isCustomPrice: true
  },
];

const Pricing = () => {
  return (
    <section className="py-24 px-6 bg-[#fcfcfc]" id="pricing">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 text-brand-primary uppercase font-display">Pricing & Plans</h2>
          <p className="text-xl text-black/80 max-w-2xl mx-auto">
            Simple, transparent pricing for every stage of your growth.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`relative p-8 rounded-[40px] border flex flex-col transition-all ${
                plan.popular 
                  ? 'border-brand-primary bg-brand-primary text-brand-secondary shadow-2xl shadow-brand-primary/20 scale-105 z-10' 
                  : 'border-black/5 bg-white text-black'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-brand-secondary text-brand-primary text-xs font-bold uppercase tracking-widest px-4 py-1 rounded-full">
                  Most Popular
                </div>
              )}
              
              <div className="mb-8">
                <h3 className="text-2xl font-bold uppercase font-display mb-2">{plan.name}</h3>
                <p className={`text-sm font-medium ${plan.popular ? 'text-brand-secondary/80' : 'text-black/60'}`}>
                  {plan.description}
                </p>
              </div>

              <div className="mb-8">
                <div className="flex items-baseline gap-1">
                  {plan.isCustomPrice ? (
                    <span className="text-4xl font-bold font-display">Custom Pricing</span>
                  ) : (
                    <>
                      <span className="text-5xl font-bold font-display">${plan.price}</span>
                      <span className={`text-sm font-bold uppercase tracking-widest opacity-80`}>/Month</span>
                    </>
                  )}
                </div>
              </div>

              <ul className="space-y-4 mb-12 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-sm font-bold">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${plan.popular ? 'bg-brand-secondary' : 'bg-brand-primary'}`} />
                    {feature}
                  </li>
                ))}
              </ul>

              <Link
                to="/register"
                className={`block w-full py-4 rounded-full font-bold text-center text-lg transition-all ${
                  plan.popular
                    ? 'bg-brand-secondary text-brand-primary hover:bg-white hover:text-brand-primary shadow-xl shadow-brand-secondary/20'
                    : 'bg-brand-primary text-brand-secondary hover:bg-brand-secondary hover:text-brand-primary shadow-lg shadow-brand-primary/10'
                }`}
              >
                {plan.cta}
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="mt-16 max-w-4xl mx-auto text-center">
          <p className="text-sm text-black/50 leading-relaxed font-medium italic">
            <span className="font-bold uppercase tracking-wider not-italic mr-1">Disclaimer:</span>
            Our pricing is exclusively in United States Dollars (USD).
          </p>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
