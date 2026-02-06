// ===== File Tree Builder =====
const arrowSVG = `<svg viewBox="0 0 24 24"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z"/></svg>`

export function buildFileTree(items, router, depth = 0) {
	let html = ''
	
	items.forEach(item => {
		const route = router.pathToRoute(item.content_path)
		const isDir = item.type === 'directory'
		const hasChildren = item.children && item.children.length > 0
		const icon = isDir ? '📁' : '📄'
		const iconClass = isDir ? 'folder' : 'file'
		const arrowClass = hasChildren ? '' : 'hidden'
		
		html += `
			<div class="tree-item" data-depth="${depth}" data-type="${item.type}">
				<a class="tree-link" href="${route}" data-link data-has-children="${hasChildren}">
					<span class="arrow ${arrowClass}">${arrowSVG}</span>
					<span class="icon ${iconClass}">${icon}</span>
					<span class="name">${item.title}</span>
				</a>
				${hasChildren ? `<div class="children">${buildFileTree(item.children, router, depth + 1)}</div>` : ''}
			</div>
		`
	})
	
	return html
}
