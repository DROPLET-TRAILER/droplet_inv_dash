import frappe
# utility functions like cint, int, flt, etc.
from frappe.utils.data import *

@frappe.whitelist()
def server_date():
  return now_datetime().strftime(DATE_FORMAT)