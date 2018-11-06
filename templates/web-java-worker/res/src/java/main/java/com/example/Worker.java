/**
 * Copyright (c) 2017-2018
 * All rights reserved.
 */

package com.example;

import com.example.FullName;

import com.rabbitmq.client.Channel;
import com.rabbitmq.client.ConnectionFactory;

import com.financialforce.orizuru.transport.rabbitmq.DefaultConsumer;
import com.financialforce.orizuru.transport.rabbitmq.MessageQueue;
import com.financialforce.orizuru.transport.rabbitmq.interfaces.IMessageQueue;

public class Worker implements Runnable {

	private static final String CONSUMER_TAG = "Worker";

	private IMessageQueue<FullName, FullName> messageQueue;

	public Worker(IMessageQueue<FullName, FullName> messageQueue) {
		this.messageQueue = messageQueue;
	}

	@Override
	public void run() {

		try {

			/**
			 * Create the connection to RabbitMQ and the Question queue
			 */
			Channel channel = messageQueue.createChannel();
			channel.queueDeclare(FullName.class.getName(), true, false, false, null);

			/** 
			 * Consume the RabbitMQ queue
			 */
			DefaultConsumer<FullName, FullName> consumer = new FullNameConsumer(channel);
			messageQueue.consume(CONSUMER_TAG, channel, consumer);

		} catch (Exception ex) {

			// For now log out the exception
			ex.printStackTrace();
		}

	}

	public static void main(String[] args) {

		ConnectionFactory factory = new ConnectionFactory();
		IMessageQueue<FullName, FullName> messageQueue = new MessageQueue<FullName, FullName>(factory);
		new Worker(messageQueue).run();

	}

}
