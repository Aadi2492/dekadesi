import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const categories = [
  ['Ghee', 'ghee'], ['Oil', 'oil'], ['Dry Fruits', 'dry-fruits'], ['Millets', 'millets'],
  ['Rava', 'rava'], ['Snacks', 'snacks'], ['Dal', 'dal'], ['Flour', 'flour'],
  ['Rice', 'rice'], ['Sweetner', 'sweetner'], ['Combos', 'combos'],
] as const;
async function main() {
  for (const [name, slug] of categories) {
    await prisma.category.upsert({ where: { slug }, update: { name, isActive: true }, create: { name, slug, isActive: true } });
  }
  console.log(`Seeded ${categories.length} DEkadesi categories.`);
}
main().finally(async () => prisma.$disconnect());
