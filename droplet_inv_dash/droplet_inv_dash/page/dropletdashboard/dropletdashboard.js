frappe.pages['dropletdashboard'].on_page_load = function(wrapper) {
	var page = frappe.ui.make_app_page({
		parent: wrapper,
		title: 'Dashboard',
		single_column: true
	});
	let $btn = page.set_primary_action('View Dashboard', () => console.log("GOOOOO"), 'octicon octicon-plus');
}