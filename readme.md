# Orizuru Tools

[![Build Status](https://travis-ci.org/financialforcedev/orizuru-tools.svg?branch=master)](https://travis-ci.org/financialforcedev/orizuru-tools)
[![NSP Status](https://nodesecurity.io/orgs/ffres/projects/bc6dad23-104f-4cd9-9c13-2c5f828d8d97/badge)](https://nodesecurity.io/orgs/ffres/projects/bc6dad23-104f-4cd9-9c13-2c5f828d8d97)

Orizuru tools are command line tools to streamline development with the [Orizuru framework](https://www.npmjs.com/package/@financialforcedev/orizuru).

## Install
Use [npm](https://docs.npmjs.com/getting-started/installing-node) to install Orizuru on the command line with the following command.

```dos
npm install @financialforcedev/orizuru-tools --global
```

## Usage

### Create new project

Orizuru includes templates, which are self-contained skeleton apps, built on top of the Orizuru framework. They include authentication, API integration with Apex and more.

Each template can be deployed to Heroku and Force.com as-is, but you should probably extend them to meet your specific business requirements first. When you're ready to deploy, run the following commands on the command line.

```dos
mkdir new-project
cd new-project
orizuru setup init
```

### Generate Apex Transport Layer

You can generate Apex classes for Apache Avro schemas. Do this whenever you create or change a schema, so that your Apex classes reflect the schema. To do so, run the following command on the command line:

```dos
orizuru setup generate-apex-transport [path/to/input/folder] [path/to/output/folder]
```

The command takes the following arguments:

|Argument|Description|
|---|---|
|path/to/input/folder|The relative path from the current directory to the folder that contains your avro schemas. Avro schemas must have the extension `.avsc` and the content should be in `JSON` format.
|path/to/output/folder|The relative path to the folder in which the generated files should be saved.|

### Deploy

Your app will be comprised of a distinct Force.com component and Heroku component.You can deploy both components using the `deploy` command.

```dos
orizuru deploy
```

Be aware that this deploys the latest git commit, so make sure you have committed any code you want to deploy. Orizuru will generate certificates which will allow the Heroku app to authenticate with Force.com.

You can also choose to generate certificates independently with

```dos
orizuru deploy certificate
```

Or push a connected app to your scratch org with

```dos
orizuru deploy connected-app
```

You will be prompted to enter some details about your app, for example:
* Whether you want to create a new scratch org, or deploy to an existing one
* Whether you want to create a new Heroku app, or deploy to an existing one
Where possible, the tools will suggest default values.

As prerequisites, ensure you have:
* Installed the [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli)
* Installed the [SFDX CLI](https://developer.salesforce.com/tools/sfdxcli)
* Installed [OpenSSL](https://www.openssl.org/)
* An active [Dev Hub](https://developer.salesforce.com/promotions/orgs/dx-signup)