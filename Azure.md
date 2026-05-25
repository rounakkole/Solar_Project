

1. **Create resource group**
```
Resource group create 
name solar-rg 
location APAC central India
```

2. **Create MySQL Flexible Server**
```
  --az mysql flexible-server create 
  --resource-group solar-rg \
  --name solar-mysql-server \
Azure Database for MySQL Flexible Server B1ms
Burstable, B1ms
1 vCores, 2 GiB RAM, 20 GiB storage, Auto scale IOPS
USD 20.51/month

  --admin-user solaradmin \
MySQL and Microsoft Entra authentication
admin "sqladmin"
admin-password "Password@123" 
Database port 3306


3. **Create App Service plan and Web App (backend)**
```
az appservice plan create --name solar-appservice-plan --resource-group solar-rg --sku B1 --is-linux
Basic B1 (100 total ACU, 1.75 GB memory, 1 vCPU)

Create Web App
Name solar-webapp
Code Node 22 LTS
Linux Plan (Central India) solar-appservice-plan (B1)
Continuous deployment Enable
```


4. **Create Static Web App (frontend)**
```
az staticwebapp create \
  --name solar-staticwebapp \
  --app-location "solar-frontend" \
```


---

### 2. Initialize the database
Click on your specific server name: solar-mysql-server.
On the left-hand navigation menu, scroll down to the Settings section and click on Databases.
Click the + Add button at the top of the Databases pane.
Name solar-mysql-db

- **Download** `solar_database.sql` from the repo.
Go to Azure >> solar-mysql-server
At the very top right of the screen (next to the search bar), click the Cloud Shell icon (it looks like >_).
If it asks you to choose between Bash or PowerShell, choose Bash.
You need to upload your solar-mysql-server.sql file to this shell. Click the Upload/Download files icon in the Cloud Shell menu bar and select Upload.
Select the solar-mysql-db.sql file from your computer to upload it.
Once uploaded, paste your exact command into the terminal and hit Enter:
mysql -h solar-mysql-server.mysql.database.azure.com -u sqladmin -p -P 3306 solar-mysql-db < solar-mysql-db.sql
Type in your Azure database password when prompted.
---





### 3. Configure App Service environment variables
Set the backend app settings (App Service → Configuration or CLI). Required env vars
match your repos\Solar_Project\solar-backend\config\db.js
match your repos\Solar_Project\solar-backend\config\email.js

```
To disable SSL, please update the require_secure_transport server parameter to OFF.
solar-webapp | Environment variables
Go to your Web App in the Azure Portal.
Click on Environment variables (under Settings).
DB_HOST solar-mysql-server.mysql.database.azure.com
DB_USER sqladmin
DB_PASSWORD Password@123
DB_NAME solar-mysql-db
RAZORPAY_KEY_ID 1234
RAZORPAY_KEY_SECRET 1234
DB_PORT 3306
FRONTEND_URL https://witty-sea.azurestaticapps.net
```

Go to the Azure Portal and navigate to your backend Web App
On the left-hand menu, scroll down to the API section and click on CORS.
Under "Allowed Origins", paste your exact frontend URL:
https://witty-sea.azurestaticapps.net
Check the box at the top that says Enable Access-Control-Allow-Credentials.



Go to your GitHub repository in the browser.
Click Settings -> Secrets and variables (on the left) -> Actions.
You must add your environment variable here so the build script can see it!
Click New repository secret.
Name: VITE_BACKEND_URL
Secret: https://solar-webapp.centralindia-01.azurewebsites.net


### 7. Frontend to Backend configuration
- **Frontend env**: In `solar-frontend`, create `.env.production` or set Vite env var in Static Web App configuration:
  ```
  VITE_API_BASE_URL=https://solar-backend-<unique>.azurewebsites.net
  ```
---


**Open firewall for your IP**
```
az mysql flexible-server firewall-rule create \
  --resource-group solar-rg \
  --name solar-mysql-server-<unique> \
  --rule-name allow_my_ip \
  --start-ip-address <YOUR_IP> \
  --end-ip-address <YOUR_IP>
> App Service outbound IPs will need access later
```
