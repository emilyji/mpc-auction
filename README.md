# mpc-auction
A prototype of a distributed, online auction system that uses secure multi-party computation (MPC)

## Requirements
Running the application requires [Node](https://nodejs.org/en/), [npm](https://www.npmjs.com/), and [MongoDB](https://docs.mongodb.com/manual/administration/install-community/).

This application runs locally with HTTPS. Therefore, it also requires [mkcert](https://github.com/FiloSottile/mkcert), a tool for 1) creating and installing a local certificate authority and 2) generating a locally-trusted development certificate. Anyone who wants to run the auction system on their own computer will need to generate a new SSL/TLS certificate for local development. Follow steps 1-4 [here](https://web.dev/how-to-use-local-https/#setup) to do so. (Make sure to follow the "with Node" section under step 4 and confirm that lines 22 and 23 of the [server.js](server/server.js) file contain the correct paths to your newly created certificate and certificate key respectively.)

## Installation and Setup
Navigate to the ```mpc-auction/``` directory

Set up JIFF:
```
git submodule init
git submodule update
npm install --prefix jiff
```

Install all dependencies:
```
npm install
```

Make sure that MongoDB is running on your computer. To run it as a macOS background service, the command is:
```
brew services start mongodb-community
```
More information can be found on the Install MongoDB Community Edition [page](https://docs.mongodb.com/manual/administration/install-community/).

## Running the Auction System
Navigate to the ```mpc-auction/``` directory

Start the server:
```
ADMINISTRATOR_EMAIL_USER="example@gmail.com" ADMINISTRATOR_EMAIL_PASS="example_password" node server/server.js
```
ADMINISTRATOR_EMAIL_USER and ADMINISTRATOR_EMAIL_PASS specify login credentials for the auction administrator's email account. This email account will be used to send auction information to the registered bidders. If using a gmail account, you will need to turn on ["Less secure apps access"](https://support.google.com/accounts/answer/6010255?hl=en#zippy=%2Cif-less-secure-app-access-is-on-for-your-account).

## Using the Auction System
After starting the HTTPS server, follow the steps below to operate the application.

### As the auction administrator

#### 1. Create a new auction

* Navigate to `https://localhost:8443/create-auction`
* Enter auction details and then click **Create**

#### 2. Manage the auction

* Navigate to `https://localhost:8443/manage`
* *After the registration deadline passes*, click **Update Configuration File** to update config.json with the number of registered participants (input parties)
* *After all compute parties are connected to the server*, click **Notify Auction Participants** to email the bid submission page link to all registered participants 
* *After the compute parties finish performing the MPC*, click **Email Auction Results** or **Include Sale Price** to send the auction results to the bidders
* To officially end the auction and return to the auction creation page, click **End This Auction**

### As a compute party

The auction system currently consists of 3 compute parties, as configured in [config.json](server/config.json). (The number of compute parties can be changed by removing or adding ID values to the ```compute_parties``` array in the config.json file.)

JIFF requires the number of input parties to be specified before the MPC begins. This means that the compute parties can only be started **after** the registration deadline passes and the auction administrator updates config.json with the number of registered participants.

Open a new terminal window, navigate to the ```mpc-auction/``` directory, and use the following command to run a single compute party:
```
node compute-party.js ./server/config.json
```

In a real deployment environment, each compute party would be run on a separate machine. For local development, however, they can all be run on the same machine.

### As a bidder

#### 1. Register for the auction

* Navigate to `https://localhost:8443`
* Enter an email and password, which will later be used to log in to the bid submission page

#### 2. Submit a bid

Each bidder will receive an email with a link to the bid submission page:
* Log in at `https://localhost:8443/login`
* Enter a bid value at `https://localhost:8443/auction` and then click **Submit**