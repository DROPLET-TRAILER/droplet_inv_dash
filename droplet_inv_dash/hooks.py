# -*- coding: utf-8 -*-
from __future__ import unicode_literals
from . import __version__ as app_version

app_name = "droplet_inv_dash"
app_title = "Droplet Inv Dash"
app_publisher = "BCIT CST 2022"
app_description = "dashboard for order procurement information"
app_icon = "octicon octicon-file-directory"
app_color = "grey"
app_email = "sanderson162@my.bcit.ca"
app_license = "MIT"

# Includes in <head>
# ------------------

# include js, css files in header of desk.html
# app_include_css = "/assets/droplet_inv_dash/css/droplet_inv_dash.css"
# app_include_js = "/assets/droplet_inv_dash/js/droplet_inv_dash.js"

# include js, css files in header of web template
# web_include_css = "/assets/droplet_inv_dash/css/droplet_inv_dash.css"
# web_include_js = "/assets/droplet_inv_dash/js/droplet_inv_dash.js"

# include js in page
# page_js = {"page" : "public/js/file.js"}

# include js in doctype views
# doctype_js = {"doctype" : "public/js/doctype.js"}
# doctype_list_js = {"doctype" : "public/js/doctype_list.js"}
# doctype_tree_js = {"doctype" : "public/js/doctype_tree.js"}
# doctype_calendar_js = {"doctype" : "public/js/doctype_calendar.js"}

# Home Pages
# ----------

# application home page (will override Website Settings)
# home_page = "login"

# website user home page (by Role)
# role_home_page = {
#	"Role": "home_page"
# }

# Website user home page (by function)
# get_website_user_home_page = "droplet_inv_dash.utils.get_home_page"

# website_redirects = [
#     {"source": "/app/dropdash", "target": "special"},
# ]

# website_route_rules = [
#     {"from_route": "/app/dropdash", "to_route": "special"},
# ]

# Generators
# ----------

# automatically create page for each record of this doctype
# website_generators = ["Web Page"]

# Installation
# ------------

# before_install = "droplet_inv_dash.install.before_install"
# after_install = "droplet_inv_dash.install.after_install"

# Desk Notifications
# ------------------
# See frappe.core.notifications.get_notification_config

# notification_config = "droplet_inv_dash.notifications.get_notification_config"

# Permissions
# -----------
# Permissions evaluated in scripted ways

# permission_query_conditions = {
# 	"Event": "frappe.desk.doctype.event.event.get_permission_query_conditions",
# }
#
# has_permission = {
# 	"Event": "frappe.desk.doctype.event.event.has_permission",
# }

# Document Events
# ---------------
# Hook on document methods and events

# doc_events = {
# 	"*": {
# 		"on_update": "method",
# 		"on_cancel": "method",
# 		"on_trash": "method"
#	}
# }

# Scheduled Tasks
# ---------------

# scheduler_events = {
# 	"all": [
# 		"droplet_inv_dash.tasks.all"
# 	],
# 	"daily": [
# 		"droplet_inv_dash.tasks.daily"
# 	],
# 	"hourly": [
# 		"droplet_inv_dash.tasks.hourly"
# 	],
# 	"weekly": [
# 		"droplet_inv_dash.tasks.weekly"
# 	]
# 	"monthly": [
# 		"droplet_inv_dash.tasks.monthly"
# 	]
# }

# Testing
# -------

# before_tests = "droplet_inv_dash.install.before_tests"

# Overriding Methods
# ------------------------------
#
# override_whitelisted_methods = {
# 	"frappe.desk.doctype.event.event.get_events": "droplet_inv_dash.event.get_events"
# }
#
# each overriding function accepts a `data` argument;
# generated from the base implementation of the doctype dashboard,
# along with any modifications made in other Frappe apps
# override_doctype_dashboards = {
# 	"Task": "droplet_inv_dash.task.get_dashboard_data"
# }

