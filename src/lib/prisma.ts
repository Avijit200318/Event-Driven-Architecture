import { PrismaClient } from "@prisma/client";


// if any edge there is a connection then use it and if there is not a connection then create one. so that we will not be outoff limit
const prismaClientSingleTon = () => {
    return new PrismaClient();
}

type prismaClientSingleTon = ReturnType<typeof prismaClientSingleTon>;
// this line typescrip says this 'prismaClientSingleTon' always return this type.

const globalForPrisma = global as unknown as { prisma: PrismaClient | undefined };

const prisma = globalForPrisma.prisma ?? prismaClientSingleTon();
// if 'globalForPrisma.prisma' does not exist then run this code 'prismaClientSingleTon()'

export default prisma;

// this line prevent during development reload would create a new PrismaClient instance
if(process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;