# -*- coding: utf-8 -*-
from setuptools import setup, find_packages

with open('requirements.txt') as f:
	install_requires = f.read().strip().split('\n')

# get version from __version__ variable in droplet_inv_dash/__init__.py
from droplet_inv_dash import __version__ as version

setup(
	name='droplet_inv_dash',
	version=version,
	description='dashboard for order procurement information',
	author='BCIT CST 2022',
	author_email='sanderson162@my.bcit.ca',
	packages=find_packages(),
	zip_safe=False,
	include_package_data=True,
	install_requires=install_requires
)
