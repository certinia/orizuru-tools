# Orizuru Tools

Orizuru tools are command line tools to streamline development with the orizuru framework.

## Install

	$ npm install @financialforcedev/orizuru-tools -g

## Usage

### Create new project

You can create a new template project from our list of projects. These projects are usage examples that can then me modified further to suit your use case. They wrap the orizuru framework with boilerplate to allow for the rapid development, and come with authentication and API integration with apex, etc.

	$ mkdir new-project

	$ cd new-project

	$ orizuru setup init

### Generate apex transport layer

You can generate apex classes for avro schemas specified as ```json``` in ```.avsc``` files. Our useage examples usually wrap this command within an npm command that specifies the input folder and output folder. Rerun this command if you change a schema in an example and would like your apex transport classes to reflect this change.

	$ orizuru setup generateapextransport [Input folder] [Output folder]

Input folder: contains your ```.avsc``` files.

Output folder: the folder you would like your generated ```OrizuruTransport.cls``` file to be generated in.