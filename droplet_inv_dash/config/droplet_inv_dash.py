from __future__ import unicode_literals
from frappe import _

def get_data():
	return [
		{
			"label": _("DROPLET"),
			"icon": "fa fa-list",
			"items": [
				{
					"type": "doctype",
					"name": "Dashboard",
					"description": _("DASHBOARD."),
					"onboard": 1,
				},
				{
					"type": "page",
					"name": "droplet-dashboard",
					"label": _("DROPLET Dashboard"),
					"icon": "fa fa-bar-chart",
					"onboard": 1,
				},
			]
		},
	]
