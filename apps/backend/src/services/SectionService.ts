import { PrismaClient } from "@prisma/client";
import {
    CreateSectionDto,
    UpdateSectionDto,
    SectionResponse,
    AppError,
    NotFoundError,
    ForbiddenError,
} from "../types";

const prisma = new PrismaClient();

// ============================================================================
// SECTION SERVICE
// ============================================================================

export class SectionService {
    /**
     * Create a new section
     */
    async createSection(
        userId: string,
        data: CreateSectionDto
    ): Promise<SectionResponse> {
        const isInbox = data.projectId === "none" || !data.projectId;

        // Verify project ownership if not Inbox
        if (!isInbox) {
            const project = await prisma.project.findUnique({
                where: { id: data.projectId },
            });

            if (!project || project.userId !== userId || project.deletedAt) {
                throw new ForbiddenError("Invalid or inaccessible project");
            }
        }

        // Get the next order
        let order = data.order;
        if (order === undefined || order === null) {
            const lastSection = await prisma.section.findFirst({
                where: {
                    projectId: isInbox ? null : data.projectId,
                    deletedAt: null,
                },
                orderBy: { order: "desc" },
            });
            order = (lastSection?.order ?? -1) + 1;
        }

        const section = await prisma.section.create({
            data: {
                projectId: isInbox ? null : data.projectId,
                userId,
                name: data.name,
                order,
            },
        });

        return this.formatSectionResponse(section);
    }

    /**
     * Get all sections for a project
     */
    async getProjectSections(
        userId: string,
        projectId: string
    ): Promise<SectionResponse[]> {
        const isInbox = projectId === "none" || !projectId;

        // Verify project access if not Inbox
        if (!isInbox) {
            const project = await prisma.project.findUnique({
                where: { id: projectId },
            });

            if (!project || project.userId !== userId || project.deletedAt) {
                throw new ForbiddenError("Invalid or inaccessible project");
            }
        }

        const sections = await prisma.section.findMany({
            where: {
                projectId: isInbox ? null : projectId,
                userId,
                deletedAt: null,
            },
            orderBy: { order: "asc" },
        });

        return sections.map((s) => this.formatSectionResponse(s));
    }

    /**
     * Get a single section
     */
    async getSection(sectionId: string, userId: string): Promise<SectionResponse> {
        const section = await prisma.section.findUnique({
            where: { id: sectionId },
        });

        if (!section || section.deletedAt) {
            throw new NotFoundError("Section");
        }

        if (section.userId !== userId) {
            throw new ForbiddenError("You don't have access to this section");
        }

        return this.formatSectionResponse(section);
    }

    /**
     * Update a section
     */
    async updateSection(
        sectionId: string,
        userId: string,
        data: UpdateSectionDto
    ): Promise<SectionResponse> {
        // Verify ownership
        await this.getSection(sectionId, userId);

        const section = await prisma.section.update({
            where: { id: sectionId },
            data: {
                name: data.name,
                order: data.order,
            },
        });

        return this.formatSectionResponse(section);
    }

    /**
     * Reorder multiple sections
     */
    async reorderSections(
        userId: string,
        sections: Array<{ id: string; order: number }>
    ): Promise<SectionResponse[]> {
        // Verify all sections belong to user
        const dbSections = await prisma.section.findMany({
            where: {
                id: { in: sections.map((s) => s.id) },
                deletedAt: null,
            },
        });

        if (dbSections.length !== sections.length) {
            throw new NotFoundError("One or more sections not found");
        }

        // Check ownership
        if (!dbSections.every((s) => s.userId === userId)) {
            throw new ForbiddenError("You don't have access to some sections");
        }

        // Update all sections
        const updated = await Promise.all(
            sections.map((s) =>
                prisma.section.update({
                    where: { id: s.id },
                    data: { order: s.order },
                })
            )
        );

        return updated.map((s) => this.formatSectionResponse(s));
    }

    /**
     * Soft delete a section
     */
    async deleteSection(sectionId: string, userId: string): Promise<void> {
        // Verify ownership
        await this.getSection(sectionId, userId);

        await prisma.section.update({
            where: { id: sectionId },
            data: { deletedAt: new Date() },
        });
    }

    /**
     * Format section response
     */
    private formatSectionResponse(section: any): SectionResponse {
        return {
            id: section.id,
            projectId: section.projectId,
            userId: section.userId,
            name: section.name,
            order: section.order,
            createdAt: section.createdAt.toISOString(),
            updatedAt: section.updatedAt.toISOString(),
            deletedAt: section.deletedAt ? section.deletedAt.toISOString() : null,
        };
    }
}

export const sectionService = new SectionService();
