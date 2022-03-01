frappe.pages['dropletdashboard'].on_page_load = function(wrapper) {
	new DropDash(wrapper);
}

// PAGE CONTENT
DropDash = Class.extend({
	init: function (wrapper) {
		this.page = frappe.ui.make_app_page({
			parent: wrapper,
			title: 'Droplet Dashboard',
			single_column: true
		});
		// Make Page
		this.make();
	},
	//Make Page Function
	make: function () {
		// Grab the Class
		let me = $(this);

		// Push DOM element to page
		$(frappe.render_template(frappe.droplet_dash_page.body, this)).appendTo(this.page.main);
		window.location.href = frappe.urllib.get_full_url("/special");
	}
	// End of Class
})

// HTML Content
let body = '<h1>Opening Dashboard...</h1>';
frappe.droplet_dash_page =  {
	body: body
}
