'use strict';

module.exports = {
	transport: require('@financialforcedev/orizuru-transport-rabbitmq'),
	transportConfig: {
		cloudamqpUrl: process.env.CLOUDAMQP_URL
	}
};
