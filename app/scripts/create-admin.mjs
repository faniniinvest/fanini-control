// Modifique o arquivo create-admin.mjs
import pkg from "bcryptjs";
const { hash } = pkg;
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    const password = await hash("Fanini@2025*", 12);

    const admin = await prisma.user.create({
      data: {
        name: "Adminfanini",
        email: "faninimesaproprietaria@gmail.com",
        password,
        role: "ADMIN",
      },
    });

    console.log(`Admin criado com sucesso:`);
    console.log(`Email: ${admin.email}`);
    console.log(`Nome: ${admin.name}`);
  } catch (error) {
    console.error("Erro ao criar admin:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
