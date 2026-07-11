import React from 'react';
import Layout from '../components/Layout';
import { motion } from 'motion/react';
import { Target, Eye, Heart, Users, Zap } from 'lucide-react';

const About = () => {
  return (
    <Layout>
      <section className="pt-32 pb-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center mb-32">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 text-brand-primary">
                We believe in <br />
                <span className="text-brand-secondary font-display uppercase tracking-tighter">Design that Grows</span>
              </h1>
              <p className="text-xl text-black/80 leading-relaxed mb-8">
                PRK GRAPHICZ strives to help startups rise in their graphic design journey and focus on the core business that they love to do everyday.
              </p>
              <p className="text-lg text-black/70 leading-relaxed">
                Founded by Prechand Angoelal, PRK GRAPHICZ was born out of a passion for creative problem-solving and a vision to make high-quality design accessible to every startup.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative aspect-square bg-black/5 rounded-3xl overflow-hidden"
            >
              <img 
                src="https://picsum.photos/seed/creative-studio/800/800" 
                alt="Creative Studio" 
                className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700"
                referrerPolicy="no-referrer"
              />
            </motion.div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-32">
            <div className="p-12 bg-[#fcfcfc] rounded-3xl border border-black/5 shadow-sm">
              <div className="w-12 h-12 bg-brand-primary/10 text-brand-primary rounded-xl flex items-center justify-center mb-8">
                <Target size={24} />
              </div>
              <h3 className="text-3xl font-bold mb-6 text-[#1a1a1a]">Our Vision</h3>
              <p className="text-lg text-[#1a1a1a]/70 leading-relaxed">
                That PRK GRAPHICZ strives to help startup to rise in their graphic design journey and focus on the core business that they love to do everyday.
              </p>
            </div>
            <div className="p-12 bg-[#fcfcfc] rounded-3xl border border-black/5 shadow-sm">
              <div className="w-12 h-12 bg-brand-secondary/10 text-brand-secondary rounded-xl flex items-center justify-center mb-8">
                <Eye size={24} />
              </div>
              <h3 className="text-3xl font-bold mb-6 text-[#1a1a1a]">Our Mission</h3>
              <p className="text-lg text-[#1a1a1a]/70 leading-relaxed">
                Making sure our clients experience an uninterruptible communication with us and stay consistent with design made with their vision.
              </p>
            </div>
          </div>

          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-4xl font-bold mb-12">Our Core Values</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
              {[
                { title: 'Creativity', desc: 'Pushing boundaries with refreshing ideas.', icon: <Zap size={20} /> },
                { title: 'Consistency', desc: 'Maintaining your brand identity across all platforms.', icon: <Heart size={20} /> },
                { title: 'Communication', desc: 'Clear, fast, and uninterruptible dialogue.', icon: <Users size={20} /> },
                { title: 'Quality', desc: 'Delivering excellence in every pixel.', icon: <Target size={20} /> },
              ].map((value) => (
                <div key={value.title} className="flex gap-4">
                  <div className="mt-1 text-brand-primary">{value.icon}</div>
                  <div>
                    <h4 className="font-bold mb-1">{value.title}</h4>
                    <p className="text-sm text-black/60">{value.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default About;
