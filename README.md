## Droplet Inv Dash

Dashboard for Order Procurement Information.

#### License

MIT# droplet_inv_dash

## Team
- Steven
- Stirling
- Isaac
- Dan

## Installation
These commands can be executed from the terminal on the server instance of ERPNext (hosted server).

#### Go to Apps Folder in frappe-bench Directory
```cd /home/frappe/frappe-bench/apps/```

#### Download the Application to the apps folder
```bench get-app https://github.com/Sanderson162/droplet_inv_dash.git```

#### Go to frappe-bench directory
```cd /home/frappe/frappe-bench```

#### Install the App on the given site
```bench --site <site.site> install-app droplet_inv_dash```
###### site.site = name of site to install on
###### Example for our install on a test site
```bench --site site1.local install-app droplet_inv_dash```

#### Pulling Changes
```cd /home/frappe/frappe-bench/apps/droplet_inv_dash```

```git pull```

#### Updating the Site given your site name
```bench --site <site.site> migrate```

```bench --site <site.site> build```

```bench --site <site.site> restart```

#### Accessing Dashboard

###### Step 1
Select Icon in Interface.

![image](https://drive.google.com/uc?export=view&id=1srv5qH8kmuyytT_EcFRqLtAOXC34jupX)

###### Step 2
Select link to dashboard page.

![image](https://drive.google.com/uc?export=view&id=1ss-YwF23modfwXxqMk_h6QjQJHtUkDuD)

###### Step 3
View Dashboard.

![image](https://drive.google.com/uc?export=view&id=1k-v7NwnRcSSRo1yMW3v30qyX-KM9psFJ)

