// ===== SPA Router (History API) =====
class Router {
	constructor() {
		this.routes = new Map()
		this.manifest = null
		this.flatRoutes = []
		
		window.addEventListener('popstate', () => this.handleRoute())
	}
	
	// Build routes from manifest
	buildRoutes(items, parentPath = '') {
		items.forEach(item => {
			// Create URL-friendly route from content_path
			const route = this.pathToRoute(item.content_path)
			
			this.routes.set(route, {
				title: item.title,
				type: item.type,
				contentPath: item.content_path,
				parentPath: parentPath
			})
			
			this.flatRoutes.push({
				route,
				title: item.title,
				type: item.type,
				contentPath: item.content_path
			})
			
			if (item.children && item.children.length > 0) {
				this.buildRoutes(item.children, route)
			}
		})
	}
	
	// Convert content path to route (e.g., /nature/README.html -> /nature)
	pathToRoute(contentPath) {
		if (!contentPath) return '/'
		return contentPath
			.replace(/\.html$/, '')
			.replace(/\/README$/i, '')
			.replace(/\/readme$/i, '')
			|| '/'
	}
	
	// Navigate to a route
	navigate(route, replace = false) {
		if (replace) {
			history.replaceState({ route }, '', route)
		} else {
			history.pushState({ route }, '', route)
		}
		this.handleRoute()
	}
	
	// Get current route from pathname
	getCurrentRoute() {
		const path = window.location.pathname
		// Handle base path if served from subdirectory
		return path || '/'
	}
	
	// Handle route change
	async handleRoute() {
		const route = this.getCurrentRoute()
		const routeData = this.routes.get(route)
		
		if (routeData) {
			await this.loadContent(routeData)
			this.updateActiveNav(route)
			this.updateBreadcrumb(route, routeData)
			document.title = `${routeData.title} - Doc.`
		} else {
			// Try to find a matching route
			const matchedRoute = this.findMatchingRoute(route)
			if (matchedRoute) {
				this.navigate(matchedRoute, true)
			} else {
				this.show404()
			}
		}
	}
	
	// Find a matching route (partial match)
	findMatchingRoute(route) {
		for (const [r] of this.routes) {
			if (r.startsWith(route) || route.startsWith(r)) {
				return r
			}
		}
		return null
	}
	
	// Load content from content-store
	async loadContent(routeData) {
		const contentBody = document.getElementById('content-body')
		
		try {
			const response = await fetch(`./content-store${routeData.contentPath}`)
			if (!response.ok) throw new Error('Not found')
			contentBody.innerHTML = await response.text()
		} catch (error) {
			contentBody.innerHTML = `<p>Error loading: ${routeData.contentPath}</p>`
		}
	}
	
	// Update active state in navigation
	updateActiveNav(route) {
		document.querySelectorAll('.tree-link').forEach(link => {
			const linkRoute = link.getAttribute('href')
			link.classList.toggle('active', linkRoute === route)
		})
		
		// Expand parent folders
		const activeLink = document.querySelector(`.tree-link[href="${route}"]`)
		if (activeLink) {
			let parent = activeLink.closest('.children')
			while (parent) {
				parent.classList.add('open')
				const arrow = parent.previousElementSibling?.querySelector('.arrow')
				if (arrow) arrow.classList.add('expanded')
				parent = parent.parentElement.closest('.children')
			}
		}
	}
	
	// Update breadcrumb
	updateBreadcrumb(route, routeData) {
		const breadcrumb = document.getElementById('breadcrumb')
		const parts = route.split('/').filter(Boolean)
		
		let html = `<a href="/" data-link>Home</a>`
		let currentPath = ''
		
		parts.forEach((part, i) => {
			currentPath += '/' + part
			const isLast = i === parts.length - 1
			html += `<span>/</span>`
			if (isLast) {
				html += routeData.title
			} else {
				html += `<a href="${currentPath}" data-link>${part}</a>`
			}
		})
		
		breadcrumb.innerHTML = html
	}
	
	// Show 404
	show404() {
		const contentBody = document.getElementById('content-body')
		contentBody.innerHTML = `<h1>404</h1><p>Page not found. <a href="/" data-link>Go home</a></p>`
		document.getElementById('breadcrumb').innerHTML = `<a href="/" data-link>Home</a> <span>/</span> 404`
	}
}

// ===== File Tree Builder =====
const arrowSVG = `<svg viewBox="0 0 24 24"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z"/></svg>`

function buildFileTree(items, router, depth = 0) {
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

// ===== Mobile Menu =====
function setupMobileMenu(router) {
	const toggle = document.getElementById('menu-toggle')
	const sidebar = document.getElementById('sidebar')
	const overlay = document.getElementById('overlay')
	
	function closeMenu() {
		toggle.classList.remove('active')
		sidebar.classList.remove('open')
		overlay.classList.remove('active')
	}
	
	toggle.addEventListener('click', () => {
		toggle.classList.toggle('active')
		sidebar.classList.toggle('open')
		overlay.classList.toggle('active')
	})
	
	overlay.addEventListener('click', closeMenu)
	
	// Return close function for use elsewhere
	return closeMenu
}

// ===== Initialize App =====
async function init() {
	// Load manifest
	const response = await fetch('./manifest.json')
	const manifest = await response.json()
	
	// Initialize router
	const router = new Router()
	router.manifest = manifest
	router.buildRoutes(manifest.root)
	
	// Build file tree
	const fileTree = document.getElementById('file-tree')
	fileTree.innerHTML = buildFileTree(manifest.root, router)
	
	// Setup mobile menu
	const closeMenu = setupMobileMenu(router)
	
	// Intercept all internal link clicks (using data-link attribute)
	document.addEventListener('click', (e) => {
		const link = e.target.closest('a[data-link]')
		if (link) {
			e.preventDefault()
			const href = link.getAttribute('href')
			router.navigate(href)
			
			// Close mobile menu
			if (window.innerWidth <= 768) closeMenu()
		}
	})
	
	// Handle folder toggle clicks
	fileTree.addEventListener('click', (e) => {
		const link = e.target.closest('.tree-link')
		if (!link) return
		
		const hasChildren = link.dataset.hasChildren === 'true'
		if (hasChildren) {
			const arrow = link.querySelector('.arrow')
			const children = link.nextElementSibling
			
			if (children) {
				children.classList.toggle('open')
				arrow.classList.toggle('expanded')
			}
		}
	})
	
	// Handle initial route
	router.handleRoute()
}

init()
