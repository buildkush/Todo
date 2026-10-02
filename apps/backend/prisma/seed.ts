// Prisma seed file for populating test data

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("🌱 Starting database seed...");

    // Create a test user
    const user = await prisma.user.upsert({
        where: { email: "test@example.com" },
        update: {},
        create: {
            email: "test@example.com",
            name: "Test User",
            passwordHash: "hashed_password_placeholder",
        },
    });

    console.log(`✅ Created user: ${user.email}`);

    // Create a test project
    const project = await prisma.project.create({
        data: {
            userId: user.id,
            name: "Angular Learning",
            viewType: "list",
            description: "Learn Angular fundamentals",
        },
    });

    console.log(`✅ Created project: ${project.name}`);

    // Create test sections
    const section1 = await prisma.section.create({
        data: {
            userId: user.id,
            projectId: project.id,
            name: "Fundamentals",
            order: 0,
        },
    });

    const section2 = await prisma.section.create({
        data: {
            userId: user.id,
            projectId: project.id,
            name: "Advanced",
            order: 1,
        },
    });

    console.log(`✅ Created sections: ${section1.name}, ${section2.name}`);

    // Create test todos
    await prisma.todo.create({
        data: {
            userId: user.id,
            projectId: project.id,
            sectionId: section1.id,
            title: "Learn Dependency Injection",
            description: "Understand how DI works in Angular",
            order: 0,
        },
    });

    await prisma.todo.create({
        data: {
            userId: user.id,
            projectId: project.id,
            sectionId: section1.id,
            title: "Components & Templates",
            order: 1,
        },
    });

    await prisma.todo.create({
        data: {
            userId: user.id,
            projectId: project.id,
            sectionId: section2.id,
            title: "RxJS & Observables",
            order: 0,
        },
    });

    console.log("✅ Created test todos");
    console.log("✨ Seed complete!");
}

main()
    .catch((e) => {
        console.error("❌ Seed failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
