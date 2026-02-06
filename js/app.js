import { Router } from './router.js'
import { buildFileTree } from './file-tree.js'
import { setupMobileMenu } from './mobile-menu.js'

// ===== Initialize App =====
async function init() {
	const contentBody = document.getElementById('content-body')

	try {
		// Load manifest
		const response = await fetch('/manifest.json')
		if (!response.ok) throw new Error(`Failed to load manifest: ${response.status}`)
		const manifest = await response.json()
		
		// Initialize router
		const router = new Router()
		router.manifest = manifest
		router.buildRoutes(manifest.root)
		
		// Build file tree
		const fileTree = document.getElementById('file-tree')
		fileTree.innerHTML = buildFileTree(manifest.root, router)
		
		// Setup mobile menu
		const closeMenu = setupMobileMenu()
		
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
	} catch (error) {
		console.error('App init failed:', error)
		contentBody.innerHTML = `
			<div class="home-hero">
				<h1>Failed to load</h1>
				<p>${error.message}</p>
				<p>Make sure you're serving this app with a local server (e.g. <code>npx serve</code>), not opening the HTML file directly.</p>
			</div>
		`
	}
}

init()
