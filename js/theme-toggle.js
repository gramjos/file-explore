// ===== Theme Toggle =====
const themes = ['dark', 'light', 'retro']
const icons = { dark: '🌙', light: '☀️', retro: '📺' }

export function setupThemeToggle() {
	const toggle = document.getElementById('theme-toggle')
	const icon = toggle.querySelector('.theme-icon')
	
	// Load saved theme or default to dark
	const saved = localStorage.getItem('theme') || 'dark'
	applyTheme(saved)
	
	toggle.addEventListener('click', () => {
		const current = document.documentElement.getAttribute('data-theme') || 'dark'
		const next = themes[(themes.indexOf(current) + 1) % themes.length]
		applyTheme(next)
		localStorage.setItem('theme', next)
	})
	
	function applyTheme(theme) {
		document.documentElement.setAttribute('data-theme', theme)
		icon.textContent = icons[theme]
		toggle.title = `Theme: ${theme}`
	}
}
