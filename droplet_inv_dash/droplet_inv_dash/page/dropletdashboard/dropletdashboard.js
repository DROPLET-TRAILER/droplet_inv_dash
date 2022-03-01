frappe.pages['dropletdashboard'].on_page_load = function(wrapper) {
	let page = frappe.ui.make_app_page({
		title: 'Droplet Dashboard',
		parent: wrapper,
		single_column: true
	})

	$(frappe.render_template(frappe.droplet_dash_page.body, this)).appendTo(this.page.main);

	// Button Click Redirect
	// page.set_primary_action('Start Dashboard', () => window.location.href = frappe.urllib.get_full_url("/special")
	// , 'octicon octicon-plus');

	// Automatic Redirect
	window.location.href = frappe.urllib.get_full_url("/special");
}

// HTML Content
let body = '<h1>Starting Dashboard...</h1>';
frappe.droplet_dash_page =  {
	body: body
}
