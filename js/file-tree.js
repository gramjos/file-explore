// ===== File Tree Builder =====
const arrowSVG = `<svg viewBox="0 0 24 24"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z"/></svg>`

export function buildFileTree(manifest, router) {
	const items = manifest.items;

	// Recursive helper
	const build = (id, depth) => {
		const item = items[id];
		if (!item) return '';

		const route = router.pathToRoute(item.content_path)
		const isDir = item.type === 'directory'
		const hasChildren = item.children && item.children.length > 0
		const icon = isDir ? '📁' : '📄'
		const iconClass = isDir ? 'folder' : 'file'
		const arrowClass = hasChildren ? '' : 'hidden'
		
		// Generate children HTML first (recursion)
		let childrenHtml = ''
		if (hasChildren) {
			childrenHtml = `<div class="children">` + 
				item.children.map(childId => build(childId, depth + 1)).join('') + 
			`</div>`
		}

		return `
			<div class="tree-item" data-depth="${depth}" data-type="${item.type}">
				<a class="tree-link" href="${route}" data-link data-has-children="${hasChildren}">
					<span class="arrow ${arrowClass}">${arrowSVG}</span>
					<span class="icon ${iconClass}">${icon}</span>
					<span class="name">${item.title}</span>
				</a>
				${hasChildren ? childrenHtml : ''}
			</div>
		`
	}

	// Start building from the root ID
	if (!manifest.rootId || !items[manifest.rootId]) return '';
	return build(manifest.rootId, 0);
}
