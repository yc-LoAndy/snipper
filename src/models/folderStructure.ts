import { z } from "zod"

// Define recursive FolderSturctureSchema
// See https://github.com/colinhacks/zod#recursive-types for reference
const baseFolderStructure = z.object({
    id: z.number(),
    name: z.string(),
    snippets: z.object({
        id: z.number(),
        content: z.string(),
        fileName: z.string(),
    }).array()
})
export type FolderStructure = z.infer<typeof baseFolderStructure> & {
    children: FolderStructure[]
}
export const FolderStructureSchema: z.ZodType<FolderStructure> = baseFolderStructure.extend({
    children: z.lazy(() => FolderStructureSchema.array())
})
