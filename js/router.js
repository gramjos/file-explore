// ===== SPA Router (History API) with Named Routes =====
export class Router {
	constructor() {
		this.routes = new Map()
		this.manifest = null
		this.flatRoutes = []
		
		// Named route definitions: each declares its layout
		this.namedRoutes = {
			home: {
				path: '/',
				title: 'Home',
				sidebar: false,
				render: () => this.renderHome()
			},
			about: {
				path: '/about',
				title: 'About',
				sidebar: false,
				render: () => this.renderAbout()
			},
			notes: {
				path: '/notes',
				title: 'Notes',
				sidebar: true,
				render: (routeData) => this.renderNotes(routeData)
			}
		}
		
		this.currentNamedRoute = null
		
		window.addEventListener('popstate', () => this.handleRoute())
	}
	
	// Build routes from manifest (prefixed under /notes)
	buildRoutes(items, parentPath = '') {
		items.forEach(item => {
			const subroute = this.pathToSubRoute(item.content_path)
			const route = '/notes' + subroute
			
			this.routes.set(route, {
				title: item.title,
				type: item.type,
				contentPath: item.content_path,
				parentPath: parentPath,
				namedRoute: 'notes'
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
	
	// Convert content path to sub-route (e.g., /nature/README.html -> /nature)
	pathToSubRoute(contentPath) {
		if (!contentPath) return ''
		return contentPath
			.replace(/\.html$/, '')
			.replace(/\/README$/i, '')
			.replace(/\/readme$/i, '')
			|| ''
	}
	
	// Legacy helper kept for tree building
	pathToRoute(contentPath) {
		const sub = this.pathToSubRoute(contentPath)
		return '/notes' + sub
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
		return path || '/'
	}
	
	// Resolve which named route is active
	resolveNamedRoute(path) {
		if (path === '/') return 'home'
		if (path === '/about') return 'about'
		if (path === '/notes' || path.startsWith('/notes/') || path.startsWith('/notes?')) return 'notes'
		return null
	}
	
	// Handle route change
	async handleRoute() {
		const route = this.getCurrentRoute()
		const namedRouteName = this.resolveNamedRoute(route)
		
		// Apply layout for the named route
		this.applyLayout(namedRouteName)
		this.updateTopNav(namedRouteName)
		
		if (namedRouteName === 'home') {
			this.namedRoutes.home.render()
			document.title = 'Home - Doc.'
			return
		}
		
		if (namedRouteName === 'about') {
			this.namedRoutes.about.render()
			document.title = 'About - Doc.'
			return
		}
		
		if (namedRouteName === 'notes') {
			// Default /notes to the first manifest entry
			let routeData = this.routes.get(route)
			
			if (!routeData && route === '/notes') {
				// Navigate to the root notes route
				const firstRoute = this.flatRoutes[0]
				if (firstRoute) {
					this.navigate(firstRoute.route, true)
					return
				}
			}
			
			if (routeData) {
				await this.namedRoutes.notes.render(routeData)
				this.updateActiveNav(route)
				this.updateBreadcrumb(route, routeData)
				document.title = `${routeData.title} - Doc.`
			} else {
				const matchedRoute = this.findMatchingRoute(route)
				if (matchedRoute) {
					this.navigate(matchedRoute, true)
				} else {
					this.show404()
				}
			}
			return
		}
		
		// Unknown route
		this.show404()
	}
	
	// Apply layout: show/hide sidebar based on named route
	applyLayout(namedRouteName) {
		const app = document.getElementById('app')
		const sidebar = document.getElementById('sidebar')
		const menuToggle = document.getElementById('menu-toggle')
		const overlay = document.getElementById('overlay')
		const breadcrumb = document.getElementById('breadcrumb')
		
		const namedRoute = namedRouteName ? this.namedRoutes[namedRouteName] : null
		const showSidebar = namedRoute?.sidebar ?? false
		
		if (showSidebar) {
			app.classList.remove('home-page')
			sidebar.style.display = ''
			menuToggle.style.display = ''
			overlay.style.display = ''
			breadcrumb.style.display = ''
		} else {
			app.classList.add('home-page')
			sidebar.style.display = 'none'
			menuToggle.style.display = 'none'
			overlay.style.display = 'none'
			breadcrumb.style.display = 'none'
		}
		
		this.currentNamedRoute = namedRouteName
	}
	
	// Update active state in top nav
	updateTopNav(namedRouteName) {
		document.querySelectorAll('.nav-link').forEach(link => {
			const nav = link.dataset.nav
			link.classList.toggle('active', nav === namedRouteName)
		})
	}
	
	// Render home page
	renderHome() {
		const contentBody = document.getElementById('content-body')
		contentBody.innerHTML = `
			<div class="home-hero">
				<h1>Welcome Home</h1>
				<p>This is the home page of Doc.</p>
			</div>
		`
	}
	
	// Render about page
	renderAbout() {
		const contentBody = document.getElementById('content-body')
		contentBody.innerHTML = `
			<div class="home-hero">
				<h1>About</h1>
				<p>Doc. is a lightweight, file-explorer-style documentation viewer built with vanilla HTML, CSS, and JavaScript — no frameworks, no build tools.</p>
				
				<h2>Features</h2>
				<ul>
					<li><strong>SPA Routing</strong> — History API-based navigation with clean URLs</li>
					<li><strong>File Tree Sidebar</strong> — Expandable folder/file explorer for browsing notes</li>
					<li><strong>Mobile Friendly</strong> — Responsive layout with slide-out menu</li>
					<li><strong>Manifest Driven</strong> — Content structure defined in a single JSON file</li>
					<li><strong>Static Hosting</strong> — Deploys to Cloudflare Pages with zero config</li>
				</ul>
				
				<h2>Tech Stack</h2>
				<ul>
					<li>HTML5 &amp; CSS3</li>
					<li>Vanilla JavaScript (ES Modules)</li>
					<li>Cloudflare Pages</li>
				</ul>
				
				<h2>How It Works</h2>
				<p>Content is stored as plain HTML files in the <code>content-store/</code> directory. A <code>manifest.json</code> file describes the folder structure, which the app reads at startup to build the sidebar tree and register routes.</p>
				<p>When you click a link, the SPA router intercepts it, updates the URL via the History API, and fetches the corresponding HTML fragment — no full page reloads.</p>
				
			</div>
		`
	}
	
	// Render notes content
	async renderNotes(routeData) {
		const contentBody = document.getElementById('content-body')
		
		try {
			const response = await fetch(`/content-store${routeData.contentPath}`)
			if (!response.ok) throw new Error('Not found')
			contentBody.innerHTML = await response.text()
		} catch (error) {
			contentBody.innerHTML = `<p>Error loading: ${routeData.contentPath}</p>`
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
