import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

const Hero = () => {
  return (
    <section className="relative pt-32 pb-24 px-6 overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[radial-gradient(circle,rgba(0,102,99,0.1)_0%,transparent_70%)] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[radial-gradient(circle,rgba(255,216,51,0.1)_0%,transparent_70%)] rounded-full" />
      </div>

      <div className="max-w-7xl mx-auto text-center">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl md:text-7xl font-bold tracking-tight mb-8 leading-[0.9] text-brand-primary font-display uppercase"
        >
          Stop Designing <br />
          <span className="text-brand-secondary italic">Start Growing</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-xl text-black/80 max-w-2xl mx-auto mb-12 leading-relaxed"
        >
          PRK GRAPHICZ strives to help startups rise in their graphic design journey and focus on the core business that they love to do everyday.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-20"
        >
          <Link
            to="/register"
            className="w-fit px-10 py-4 bg-brand-primary text-brand-secondary rounded-full font-bold text-lg hover:bg-brand-secondary hover:text-brand-primary hover:rounded-xl transition-all flex items-center justify-center gap-2 shadow-2xl shadow-brand-primary/20 group min-w-[220px]"
          >
            Start a Project
            <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            to="/pricing"
            className="w-fit px-10 py-4 bg-white border border-brand-primary/20 text-brand-primary rounded-full font-bold text-lg transition-all flex items-center justify-center min-w-[220px] hover:bg-brand-primary/5 hover:border-brand-primary"
          >
            View Pricing
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-3xl mx-auto pt-12 border-t border-black/5"
        >
          {[
            'Graphic Design',
            'Social Media',
            'Branding'
          ].map((item) => (
            <div key={item} className="flex items-center justify-center gap-2 text-sm font-bold text-black/60 uppercase tracking-widest">
              <CheckCircle2 size={16} className="text-brand-primary" />
              {item}
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
