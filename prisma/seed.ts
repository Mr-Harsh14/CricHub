import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const templates = [
  {
    name: "Availability request",
    category: "PRE_MATCH",
    body: "Availability needed for {{opposition}} on {{date}}. Please use the CricHub link and add any notes.",
  },
  {
    name: "Team announcement",
    category: "PRE_MATCH",
    body: "Team for {{opposition}} on {{date}}:\n\n{{teamList}}\n\nPlease confirm if anything changes.",
  },
  {
    name: "Payment request",
    category: "POST_MATCH",
    body: "Match fees for {{opposition}} are now due. Please use your name as the reference.",
  },
];

async function main() {
  for (const template of templates) {
    await prisma.messageTemplate.upsert({
      where: { name: template.name },
      update: template,
      create: template,
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
