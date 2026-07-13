import { db } from './src/db/index';
import { packages, services, package_services } from './src/db/schema';
import { sql } from 'drizzle-orm';

async function seedDatabase() {
  console.log('Seeding database with professional packages and services...');

  // 1. Clear any existing seed data to ensure a clean run
  await db.execute(sql`TRUNCATE TABLE ${package_services} CASCADE;`);
  await db.execute(sql`TRUNCATE TABLE ${services} CASCADE;`);
  await db.execute(sql`TRUNCATE TABLE ${packages} CASCADE;`);

  console.log('Inserting services...');
  
  // 2. Insert professional agency services
  const insertedServices = await db.insert(services).values([
    {
      name: 'Brand Strategy & Identity Development',
      description: 'Comprehensive branding, including logos, color palettes, visual guidelines, typography, and positioning strategy.',
    },
    {
      name: 'UX/UI Website Design',
      description: 'Stunning website layouts, user experience journeys, component libraries, and interactive high-fidelity prototypes in Figma.',
    },
    {
      name: 'Social Media Graphic Design',
      description: 'Custom-designed graphics, story slides, templates, banners, and thumbnail assets optimized for platforms like LinkedIn, Instagram, and YouTube.',
    },
    {
      name: 'Print & Merchandising Design',
      description: 'High-quality vector layouts ready for printing, business cards, flyers, posters, brochures, and corporate merch assets.',
    },
    {
      name: 'Package & Label Design',
      description: 'Aesthetic product packaging, custom label templates, die-cuts, 3D Mockups, and materials consult.',
    },
    {
      name: 'Motion Graphics & Animation',
      description: 'Video animations, custom transitions, motion assets, and interactive logo stings.',
    }
  ]).returning();

  console.log(`✓ Inserted ${insertedServices.length} services.`);

  console.log('Inserting packages...');
  
  // 3. Insert packages with specific pricing and limits
  const insertedPackages = await db.insert(packages).values([
    {
      name: 'Essential Brand Package',
      description: 'Perfect for startups and small businesses needing core branding and visual support.',
      price: 149900, // €1499.00 in cents
      request_limit: 3,
    },
    {
      name: 'Professional Business Suite',
      description: 'Best for scaling brands seeking continuous design, web, and branding deliverables with higher priorities.',
      price: 289900, // €2899.00 in cents
      request_limit: 10,
    },
    {
      name: 'Enterprise Growth Accelerator',
      description: 'Fully comprehensive unlimited design and visual suite including complex motion designs and bespoke landing pages.',
      price: 499900, // €4999.00 in cents
      request_limit: 0, // 0 indicates unlimited requests
    }
  ]).returning();

  console.log(`✓ Inserted ${insertedPackages.length} packages.`);

  console.log('Linking packages and services (package_services)...');

  const links: { package_id: number; service_id: number }[] = [];

  // Find IDs dynamically from returning results
  const brandService = insertedServices.find(s => s.name.startsWith('Brand Strategy'));
  const webService = insertedServices.find(s => s.name.startsWith('UX/UI'));
  const socialService = insertedServices.find(s => s.name.startsWith('Social Media'));
  const printService = insertedServices.find(s => s.name.startsWith('Print & Merchandising'));
  const packageService = insertedServices.find(s => s.name.startsWith('Package & Label'));
  const motionService = insertedServices.find(s => s.name.startsWith('Motion Graphics'));

  const essentialPkg = insertedPackages.find(p => p.name.startsWith('Essential'));
  const professionalPkg = insertedPackages.find(p => p.name.startsWith('Professional'));
  const enterprisePkg = insertedPackages.find(p => p.name.startsWith('Enterprise'));

  if (essentialPkg && socialService && printService) {
    // Essential includes Social Media and Print
    links.push(
      { package_id: essentialPkg.id, service_id: socialService.id },
      { package_id: essentialPkg.id, service_id: printService.id }
    );
  }

  if (professionalPkg && brandService && webService && socialService && printService && packageService) {
    // Professional includes Brand, Web, Social, Print, Package
    links.push(
      { package_id: professionalPkg.id, service_id: brandService.id },
      { package_id: professionalPkg.id, service_id: webService.id },
      { package_id: professionalPkg.id, service_id: socialService.id },
      { package_id: professionalPkg.id, service_id: printService.id },
      { package_id: professionalPkg.id, service_id: packageService.id }
    );
  }

  if (enterprisePkg) {
    // Enterprise includes absolutely all services
    insertedServices.forEach(service => {
      links.push({ package_id: enterprisePkg.id, service_id: service.id });
    });
  }

  // Insert to the join table
  await db.insert(package_services).values(links);
  console.log(`✓ Relational package_services links successfully created.`);
  
  console.log('Database seeding successfully finished!');
  process.exit(0);
}

seedDatabase().catch(err => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
