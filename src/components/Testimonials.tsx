import React from 'react';
import { motion } from 'motion/react';
import { Quote } from 'lucide-react';

const testimonials = [
  {
    name: 'Marlène Gravenberch',
    role: 'CEO,Leadership Refocused',
    content: 'Very satisfied with PRK GRAPHICZ—great service, fast delivery, quality work, and clear communication.',
    avatar: 'https://image2url.com/r2/default/images/1772563495250-a7302a89-6db4-4476-bbeb-f649e54ec0c3.png',
  },
  {
    name: 'Esten Cohen',
    role: 'CEO ,The Lyrical Office',
    content: 'PRK Graphicz delivers! We from The Lyrical Office recommend them for excellent, affordable graphic design.',
    avatar: 'https://image2url.com/r2/default/images/1772563717767-a04404d4-8c62-4fcf-af1b-7f7e542664bf.png',
  },
  {
    name: 'Sade Lansdorf',
    role: 'CEO, PUSH Forward',
    content: 'Grateful for punctual, creative, and cooperative partnership. Excellent designs! They truly understand our vision.',
    avatar: 'https://image2url.com/r2/default/images/1772563613566-55764184-525f-4ce7-bdd4-2fa916a8524b.png',
  },
];

const Testimonials = () => {
  return (
    <section className="py-24 px-6 bg-[#fcfcfc]">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 text-[#1a1a1a]">Loved by startups</h2>
          <p className="text-xl text-[#1a1a1a]/60 max-w-2xl mx-auto">
            Don't just take our word for it. Here's what our clients have to say about their experience.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="p-8 bg-white rounded-3xl border border-black/5 flex flex-col justify-between shadow-sm"
            >
              <div>
                <Quote size={40} className="text-black/5 mb-6" />
                <p className="text-lg font-medium mb-8 leading-relaxed italic">"{testimonial.content}"</p>
              </div>
              <div className="flex items-center gap-4">
                <img
                  src={testimonial.avatar}
                  alt={testimonial.name}
                  className="w-12 h-12 rounded-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <h4 className="font-bold text-sm">{testimonial.name}</h4>
                  <p className="text-xs text-black/40 font-medium">{testimonial.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
