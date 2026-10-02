import { PrismaClient } from "@prisma/client";
import {
    CreateBoardSectionDto,
    UpdateBoardSectionDto,
    BoardSectionResponse,
    NotFoundError,
    ForbiddenError,
} from "../types";

const prisma = new PrismaClient();

// ============================================================================
// BOARD SECTION SERVICE
// ============================================================================

export class BoardSectionService {
    /**
     * Create a new board section
     */
    async createBoardSection(
        userId: string,
        data: CreateBoardSectionDto
    ): Promise<BoardSectionResponse> {
        // Verify project ownership
        const project = await prisma.project.findUnique({
            where: { id: data.projectId },
        });

        if (!project || project.userId !== userId || project.deletedAt) {
            throw new ForbiddenError("Invalid or inaccessible project");
        }

        // Get the next order
        let order = data.order ?? 0;
        if (order === undefined) {
            const lastBoardSection = await prisma.boardSection.findFirst({
                where: {
                    projectId: data.projectId,
                    deletedAt: null,
                },
                orderBy: { order: "desc" },
            });
            order = (lastBoardSection?.order ?? -1) + 1;
        }

        const boardSection = await prisma.boardSection.create({
            data: {
                projectId: data.projectId,
                userId,
                name: data.name,
                color: data.color || null,
                order,
            },
        });

        return this.formatBoardSectionResponse(boardSection);
    }

    /**
     * Get all board sections for a project
     */
    async getProjectBoardSections(
        userId: string,
        projectId: string
    ): Promise<BoardSectionResponse[]> {
        // Verify project access
        const project = await prisma.project.findUnique({
            where: { id: projectId },
        });

        if (!project || project.userId !== userId || project.deletedAt) {
            throw new ForbiddenError("Invalid or inaccessible project");
        }

        const boardSections = await prisma.boardSection.findMany({
            where: {
                projectId,
                deletedAt: null,
            },
            orderBy: { order: "asc" },
        });

        return boardSections.map((bs: any) => this.formatBoardSectionResponse(bs));
    }

    /**
     * Get a single board section
     */
    async getBoardSection(
        boardSectionId: string,
        userId: string
    ): Promise<BoardSectionResponse> {
        const boardSection = await prisma.boardSection.findUnique({
            where: { id: boardSectionId },
        });

        if (!boardSection || boardSection.deletedAt) {
            throw new NotFoundError("Board section");
        }

        if (boardSection.userId !== userId) {
            throw new ForbiddenError("You don't have access to this board section");
        }

        return this.formatBoardSectionResponse(boardSection);
    }

    /**
     * Update a board section
     */
    async updateBoardSection(
        boardSectionId: string,
        userId: string,
        data: UpdateBoardSectionDto
    ): Promise<BoardSectionResponse> {
        // Verify ownership
        await this.getBoardSection(boardSectionId, userId);

        const boardSection = await prisma.boardSection.update({
            where: { id: boardSectionId },
            data: {
                name: data.name,
                color: data.color,
                order: data.order,
            },
        });

        return this.formatBoardSectionResponse(boardSection);
    }

    /**
     * Reorder multiple board sections
     */
    async reorderBoardSections(
        userId: string,
        boardSections: Array<{ id: string; order: number }>
    ): Promise<BoardSectionResponse[]> {
        // Verify all board sections belong to user
        const dbBoardSections = await prisma.boardSection.findMany({
            where: {
                id: { in: boardSections.map((bs) => bs.id) },
                deletedAt: null,
            },
        });

        if (dbBoardSections.length !== boardSections.length) {
            throw new NotFoundError("One or more board sections not found");
        }

        // Check ownership
        if (!dbBoardSections.every((bs: any) => bs.userId === userId)) {
            throw new ForbiddenError(
                "You don't have access to some board sections"
            );
        }

        // Update all board sections
        const updated = await Promise.all(
            boardSections.map((bs) =>
                prisma.boardSection.update({
                    where: { id: bs.id },
                    data: { order: bs.order },
                })
            )
        );

        return updated.map((bs) => this.formatBoardSectionResponse(bs));
    }

    /**
     * Soft delete a board section
     */
    async deleteBoardSection(boardSectionId: string, userId: string): Promise<void> {
        // Verify ownership
        await this.getBoardSection(boardSectionId, userId);

        await prisma.boardSection.update({
            where: { id: boardSectionId },
            data: { deletedAt: new Date() },
        });
    }

    /**
     * Format board section response
     */
    private formatBoardSectionResponse(boardSection: any): BoardSectionResponse {
        return {
            id: boardSection.id,
            projectId: boardSection.projectId,
            userId: boardSection.userId,
            name: boardSection.name,
            color: boardSection.color,
            order: boardSection.order,
            createdAt: boardSection.createdAt.toISOString(),
            updatedAt: boardSection.updatedAt.toISOString(),
            deletedAt: boardSection.deletedAt
                ? boardSection.deletedAt.toISOString()
                : null,
        };
    }
}

export const boardSectionService = new BoardSectionService();
