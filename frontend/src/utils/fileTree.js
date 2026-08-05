export function normalizeFileTree(flatTree) {
    const tree = {}

    for (const [path, value] of Object.entries(flatTree)) {
        const parts = path.split('/')
        let current = tree

        parts.forEach((part, index) => {
            const isFile = index === parts.length - 1

            if (isFile) {
                current[part] = value
            } else {
                if (!current[part]) {
                    current[part] = { directory: {} }
                }
                current = current[part].directory
            }
        })
    }

    return tree
}