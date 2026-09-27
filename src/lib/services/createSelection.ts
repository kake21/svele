/**
 * A function to create the select attribute in prisma from fields. Use a constant array like
 * ```ts
 * const fieldsToExpose = ['id', 'name'] as const
 * ```
 * and spread it into the call to avoid the readonly nature of a const array.
 */
export function createSelection<const T extends string>(fieldsToExpose: T[]): { [K in T]: true } {
    return fieldsToExpose.reduce((prev, field) => ({
        ...prev,
        [field]: true,
    }), {} as { [K in T]: true })
}
