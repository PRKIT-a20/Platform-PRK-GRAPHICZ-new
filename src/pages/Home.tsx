import React from 'react';
import Layout from '../components/Layout';
import Hero from '../components/Hero';
import Pricing from '../components/Pricing';
import Testimonials from '../components/Testimonials';
import { motion } from 'motion/react';
import { ArrowRight, CheckCircle2, Zap, Palette, Share2, Rocket } from 'lucide-react';
import { Link } from 'react-router-dom';

const Home = () => {
  const services = [
    {
      title: 'Graphic Design',
      description: 'Creative, professional graphic design solutions for all needs.',
      icon: <Palette size={40} className="text-brand-primary" />,
    },
    {
      title: 'Social Media',
      description: 'Engaging social media content and strategy for growth.',
      icon: <Share2 size={40} className="text-brand-primary" />,
    },
    {
      title: 'Branding',
      description: 'Unique branding solutions to elevate your business identity.',
      icon: <Zap size={40} className="text-brand-primary" />,
    },   
  ];

  return (
    <Layout>
      <Hero />

      {/* Services Section */}
      <section className="py-24 px-6 bg-white" id="services">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20 max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">What we do?</h2>
            <p className="text-xl text-black/60 leading-relaxed">
              We specialize in crafting highly personalized and intuitive design solutions specifically for startups and growing businesses.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="p-8 rounded-3xl bg-[#fcfcfc] border border-black/5 hover:border-black/10 hover:shadow-xl hover:shadow-black/5 transition-all group flex flex-col items-center text-center"
              >
                <div className="mb-8 p-4 bg-white rounded-2xl border border-black/5 w-fit group-hover:bg-brand-secondary group-hover:scale-110 transition-all duration-300">
                  {service.icon}
                </div>
                <h3 className="text-2xl font-bold mb-4">{service.title}</h3>
                <p className="text-black/50 leading-relaxed mb-8">{service.description}</p>
                <Link 
                  to="/register" 
                  className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 px-6 py-2 rounded-lg hover:bg-brand-secondary hover:text-brand-primary transition-all"
                >
                  Request <ArrowRight size={16} />
                </Link>
              </motion.div>
            ))}
          </div>
          
          <div className="mt-16 text-center">
            <Link to="/services" className="inline-flex items-center gap-2 font-bold text-sm uppercase tracking-widest hover:gap-4 transition-all group">
              View all services <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-24 px-6 bg-brand-primary text-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20 max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-8 leading-tight">
              Our streamlined process ensures you get high-quality designs without the headache of managing freelancers.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="text-brand-secondary font-bold text-sm uppercase tracking-widest mb-4">Step 1</div>
              <h3 className="text-2xl font-bold mb-4 text-brand-secondary">Choose Your Plan</h3>
              <p className="text-white/70 leading-relaxed mb-6">
                Select the plan that fits your brand’s needs.
              </p>
              <div className="p-6 bg-white/5 border border-white/10 rounded-2xl text-sm italic text-white/60">
                <span className="font-bold text-brand-secondary not-italic block mb-1">Note:</span>
                We require a 3-month minimum commitment. Your first month is paid upfront, with subsequent billing occurring on the 26th of each month.
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="relative"
            >
              <div className="text-brand-secondary font-bold text-sm uppercase tracking-widest mb-4">Step 2</div>
              <h3 className="text-2xl font-bold mb-4 text-brand-secondary">Brand Integration & Briefing</h3>
              <p className="text-white/70 leading-relaxed">
                Upload your brand assets (logo, fonts, and colors) and tell us what you need. Simply select the specific services from your chosen plan that you’d like us to prioritize.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="relative"
            >
              <div className="text-brand-secondary font-bold text-sm uppercase tracking-widest mb-4">Step 3</div>
              <h3 className="text-2xl font-bold mb-4 text-brand-secondary">Receive & Review</h3>
              <p className="text-white/70 leading-relaxed">
                Your custom designs will be delivered based on your personalized Content Planner. You can track progress, download files, and manage your schedule directly through your Client Dashboard.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 bg-brand-primary text-brand-secondary relative overflow-hidden will-change-transform">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,216,51,0.15)_0%,transparent_70%)] pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-7xl font-bold tracking-tight mb-8">
            Let's Start Making Something Amazing Together.
          </h2>
          <p className="text-xl text-brand-secondary/60 mb-12 max-w-2xl mx-auto">
            Ready to elevate your brand? Join PRK GRAPHICZ today and experience the power of refreshing design ideas.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 px-10 py-5 bg-brand-secondary text-brand-primary rounded-full font-bold text-xl hover:bg-brand-secondary/90 transition-all shadow-2xl shadow-brand-secondary/10"
          >
            Start a Project
            <ArrowRight size={24} />
          </Link>
        </div>
      </section>

      <Testimonials />
      <Pricing />
    </Layout>
  );
};

export default Home;
