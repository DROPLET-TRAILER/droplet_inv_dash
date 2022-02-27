# coding=utf-8

from __future__ import unicode_literals
from frappe import _

def get_data():
	return [
		# Modules
		{
			"module_name": "Droplet Inv Dash",
			"category": "Modules",
			"label": _("DROPLET Dashboard"),
			"color": "#1abc9c",
			"icon": "fa fa-check-square-o",
			"type": "module",
			"description": "DROPLET Dashboard.",
			"onboard_present": 1
		},
	]