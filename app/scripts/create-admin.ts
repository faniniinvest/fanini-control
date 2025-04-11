import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";

async function main() {
  const password = await hash("Fanini@2025*", 12);

  const admin = await prisma.user.create({
    data: {
      name: "Adminfanini",
      email: "faninimesaproprietaria@gmail.com",
      password,
      role: "ADMIN",
    },
  });

  console.log(`Admin criado com sucesso: ${admin.email}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
