import React from 'react';
import Layout from '../components/Layout';
import { motion } from 'motion/react';
import { Palette, Share2, Zap, Rocket, Monitor, Image as ImageIcon, Layers, PenTool } from 'lucide-react';
import { Link } from 'react-router-dom';

const Services = () => {
  const allServices = [
    {
      title: 'Graphic Design',
      description: 'Creative, professional graphic design solutions for all needs. From logos to brochures, we cover it all.',
      icon: <Palette size={32} />,
      color: 'bg-brand-primary text-brand-secondary',
    },
    {
      title: 'Social Media',
      description: 'Engaging social media content and strategy for growth. We help you stand out in the feed.',
      icon: <Share2 size={32} />,
      color: 'bg-brand-primary text-brand-secondary',
    },
    {
      title: 'Branding',
      description: 'Unique branding solutions to elevate your business identity and create a lasting impression.',
      icon: <Zap size={32} />,
      color: 'bg-brand-primary text-brand-secondary',
    },
  ];

  return (
    <Layout>
      <section className="pt-32 pb-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl md:text-7xl font-bold tracking-tight mb-8 text-brand-primary"
            >
              Our Services
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-xl text-black/80 max-w-2xl mx-auto"
            >
              Comprehensive design solutions tailored for startups. We handle the creative, so you can focus on the growth.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {allServices.map((service, index) => (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                className="p-8 rounded-3xl bg-white border border-black/5 hover:border-black/10 hover:shadow-xl hover:shadow-black/5 transition-all group"
              >
                <div className={`mb-8 p-4 ${service.color} rounded-2xl w-fit group-hover:scale-110 transition-transform`}>
                  {service.icon}
                </div>
                <h3 className="text-2xl font-bold mb-4">{service.title}</h3>
                <p className="text-black/70 leading-relaxed">{service.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-24 px-6 bg-brand-primary text-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
            <div>
              <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-8">How it works</h2>
              <p className="text-xl text-white/90 mb-12">
                Our streamlined process ensures you get high-quality designs without the headache of managing freelancers.
              </p>
              <div className="space-y-12 relative">
                {/* Connecting Line */}
                <div className="absolute left-[11px] top-8 bottom-8 w-[2px] bg-white/20" />
                
                {[
                  { 
                    step: '01', 
                    title: 'Step 1: Choose Your Plan', 
                    desc: 'Select the plan that fits your brand’s needs.',
                    note: 'Note: We require a 3-month minimum commitment. Your first month is paid upfront, with subsequent billing occurring on the 26th of each month.'
                  },
                  { 
                    step: '02', 
                    title: 'Step 2: Brand Integration & Briefing', 
                    desc: 'Upload your brand assets (logo, fonts, and colors) and tell us what you need. Simply select the specific services from your chosen plan that you’d like us to prioritize.' 
                  },
                  { 
                    step: '03', 
                    title: 'Step 3: Receive & Review', 
                    desc: 'Your custom designs will be delivered based on your personalized Content Planner. You can track progress, download files, and manage your schedule directly through your Client Dashboard.' 
                  },
                ].map((item) => (
                  <div key={item.step} className="flex gap-8 relative z-10">
                    <div className="relative flex-shrink-0">
                      <div className="w-6 h-6 rounded-full bg-white border-4 border-brand-primary z-10 relative mt-1" />
                      <span className="absolute -left-12 top-0 text-2xl font-bold text-white/40 font-mono">{item.step}</span>
                    </div>
                    <div>
                      <h4 className="text-xl font-bold mb-3 text-white">{item.title}</h4>
                      <p className="text-white/80 leading-relaxed mb-2">{item.desc}</p>
                      {item.note && (
                        <p className="text-white/60 text-sm italic">{item.note}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square bg-white/5 rounded-3xl border border-white/10 flex items-center justify-center overflow-hidden">
                <div className="w-64 h-64 bg-white/10 blur-[100px] absolute" />
                <div className="relative z-10 text-center p-12 text-white">
                  <h3 className="text-3xl font-bold mb-6 font-display leading-tight">"Growth is never by mere chance; it is the result of forces working together."</h3>
                  <p className="text-white/60 font-medium">— James Cash Penney</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Services;
