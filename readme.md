# Orizuru Tools

[![Build Status](https://travis-ci.org/financialforcedev/orizuru-tools.svg?branch=master)](https://travis-ci.org/financialforcedev/orizuru-tools)
[![NSP Status](https://nodesecurity.io/orgs/ffres/projects/bc6dad23-104f-4cd9-9c13-2c5f828d8d97/badge)](https://nodesecurity.io/orgs/ffres/projects/bc6dad23-104f-4cd9-9c13-2c5f828d8d97)

Orizuru tools are command line tools to streamline development with the [Orizuru framework](https://www.npmjs.com/package/@financialforcedev/orizuru).

## Install

	$ npm install @financialforcedev/orizuru-tools -g

## Usage

### Create new project

You can create a new template project from our list of projects. These projects are usage examples that can then me modified further to suit your use case. They wrap the orizuru framework with boilerplate to allow for the rapid development, and come with authentication and API integration with apex, etc.

	$ mkdir new-project

	$ cd new-project

	$ orizuru setup init

### Generate apex transport layer

You can generate apex classes for Apache Avro schemas specified as ```json``` in ```.avsc``` files. Our usage examples usually wrap this command within an npm command that specifies the input folder and output folder. Rerun this command if you change a schema in an example and would like your apex transport classes to reflect this change.

	$ orizuru setup generate-apex-transport [Input folder] [Output folder]

Input folder: contains your ```.avsc``` files.

Output folder: the folder you would like your generated ```OrizuruTransport.cls``` file to be generated in.

### Deploy

You can use the deploy command to push an initial template to both Heroku and an sfdx scratch org. This requires you to have the **heroku cli** and **sfdx cli** installed, as well as **openssl**.

**NOTE:** when using ```deploy```, the latest commit in your current branch will be pushed to your Heroku app. As such, make sure you've committed any changes you would like to push **before** running the command.

	$ orizuru deploy

The command will ask you questions about which Heroku app you would like to deploy to (you can create a new one). It will also generate and push authentication certificate values to both Salesforce and Heroku to ensure your Heroku app can authenticate with Salesforce. The command uses a ```.orizuru``` folder to cache your answers to these questions, so subsequent deploys do not require as much input.

You can also choose to generate certificates independently with

	$ orizuru deploy certificate

Or push a connected app to your sfdx scratch org with

	$ orizuru deploy connected-app