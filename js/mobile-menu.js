// ===== Mobile Menu =====
export function setupMobileMenu() {
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
