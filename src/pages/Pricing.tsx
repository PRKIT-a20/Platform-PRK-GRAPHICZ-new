import React from 'react';
import Layout from '../components/Layout';
import PricingComponent from '../components/Pricing';
import { motion } from 'motion/react';
import { HelpCircle } from 'lucide-react';

const Pricing = () => {
  const faqs = [
    {
      q: 'How many designs can I request?',
      a: 'Each subscription plan includes a specific monthly design allocation. You are welcome to submit your requests as needed throughout your billing cycle until you reach your plan’s limit. This allows you to pace your projects according to your brand’s content calendar.',
    },
    {
      q: 'How fast will I receive my designs?',
      a: 'Efficiency is our priority. Most standard requests are delivered within 24–48 hours. More complex projects, such as full brand identity systems, may require additional time. To ensure total satisfaction, every design includes up to 3 rounds of revisions.',
    },
    {
      q: 'What if I don\'t like the design?',
      a: 'Our process is designed to prevent this! We build your designs based on your specific Content Planner and brand strategy. If a design isn\'t quite right, we utilize your 3 included revisions to fine-tune the work until it perfectly aligns with your vision.',
    },
    {
      q: 'Can I cancel my subscription?',
      a: 'Yes, you may cancel after your initial 3-month commitment is fulfilled. We require a 30-day notice prior to your next billing date (the 26th), along with brief feedback on why you are leaving so we can continue to improve our service.',
    },
  ];

  return (
    <Layout>
      <div className="pt-20">
        <PricingComponent />
      </div>

      {/* FAQ Section */}
      <section className="py-24 px-6 bg-[#fcfcfc]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold tracking-tight mb-4">Frequently Asked Questions</h2>
            <p className="text-black/40 font-medium">Everything you need to know about our design subscription.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {faqs.map((faq, index) => (
              <motion.div
                key={faq.q}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="p-8 bg-white rounded-3xl border border-black/5 shadow-sm"
              >
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-brand-primary/10 rounded-lg text-brand-primary">
                    <HelpCircle size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold mb-3">{faq.q}</h4>
                    <p className="text-sm text-black/60 leading-relaxed">{faq.a}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Pricing;
